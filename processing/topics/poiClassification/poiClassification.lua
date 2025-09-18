require("init")
require("Set")
require("ExtractKeys")
require("InferAddress")
require("Metadata")
require("Sanitize")
require("CopyTags")
require("ShoppingAllowedListWithCategories")
require("DefaultId")

-- We look at shop=* and amenity=<allowed_values>. We also `category`ze each into one of 4 categories for filtering.
local table = osm2pgsql.define_table({
  name = 'poiClassification',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {

    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'id', method = 'btree', unique = true  }
  }
})

-- * @desc Guards extracted to be used inside osm2pgsql.process_*
-- * @returns `true` whenever we want to exit processing the given data
local function ExitProcessing(object)
  if not (object.tags.amenity or object.tags.shop or object.tags.tourism or object.tags.leisure) then
    return true
  end

  -- Ignore all which are explicity restricted
  if object.tags.access == "private" then
    return true
  end

  -- We allow all shop=* but heavily filter amenity, tourism, leisure
  local allowed_values = Set(ExtractKeys(ShoppingAllowedListWithCategories))
  if object.tags.shop
      or allowed_values[object.tags.amenity]
      or allowed_values[object.tags.tourism]
      or allowed_values[object.tags.leisure]
  then
    -- Special case: For https://wiki.openstreetmap.org/wiki/Tag:tourism=information
    -- only allow some values
    if object.tags.tourism == "information" then
      if object.tags.information == 'office' or object.tags.information == 'visitor_centre' then
        return false
      end
      return true
    end

    return false
  end

  return true
end

-- Tag processing extracted to be used inside projcess_*
local function processTags(tags)
  -- Set our custom `category` value with one of our 4 values.
  -- We also introduce `type` as a unified way to speicify the shop-or-amenity type.
  local results = InferAddress(tags)
  if tags.shop then
    results.category = 'Einkauf'
    results.type = "shop-" .. tags.shop
  end
  if tags.amenity then
    results.category = ShoppingAllowedListWithCategories[tags.amenity]
    results.type = "amenity-" .. tags.amenity
  end
  if tags.tourism then
    results.category = ShoppingAllowedListWithCategories[tags.tourism]
    results.type = "tourism-" .. tags.tourism
  end
  if tags.leisure then
    results.category = ShoppingAllowedListWithCategories[tags.leisure]
    results.type = "leisure-" .. tags.leisure
  end

  -- This part was previously a separate dataset "education"
  local formalEducation = {
    "childcare",
    "college",
    "kindergarten",
    "research_institute",
    "school",
    "university"
  }
  results.formalEducation = Sanitize(tags.amenity, formalEducation)

  local tags_cc = { "name" }
  CopyTags(results, tags, tags_cc)
  return results
end

function osm2pgsql.process_node(object)
  if ExitProcessing(object) then return end

  table:insert({
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_point(),
    minzoom = 0,
    id = DefaultId(object)
  })
end

function osm2pgsql.process_way(object)
  if ExitProcessing(object) then return end
  if not object.is_closed then return end

  table:insert({
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_polygon():centroid(),
    minzoom = 0,
    id = DefaultId(object)
  })
end

function osm2pgsql.process_relation(object)
  if ExitProcessing(object) then return end
  -- Only process multipolygon relations to avoid inserting relations with NULL geometry
  if object.tags.type ~= 'multipolygon' then return end

  table:insert({
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_multipolygon():centroid(),
    minzoom = 0,
    id = DefaultId(object)
  })
end
