require('init')
require("Set")
require("ExtractKeys")
require("InferAddress")
require("Metadata")
require("ShoppingAllowedListWithCategories")
require("CopyTags")

-- The goal of this TodoList is to make sure we do not miss out on any amenitys.
-- The amenity key is used for all kind of stuff.
-- For our `poiClassification` list, we only include those values
-- that are part of `ShoppingAllowedListWithCategories``
-- The goal of this TodoList is, see all values that we did not include
-- … and did not explicitly decide to skip.
local table = osm2pgsql.define_table({
  name = 'poiClassification_todoList',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'value_to_check', type = 'text' },
    { column = 'tags',           type = 'jsonb' },
    { column = 'meta',           type = 'jsonb' },
    { column = 'geom',           type = 'point' },
  }
})

-- * @desc Guards extracted to be used inside projcess_*
-- * @returns `true` whenever we want to exit processing the given data
local function ExitProcessing(object)
  if not (object.tags.amenity or object.tags.shop or object.tags.tourism) then
    return true
  end

  -- We skip shop=* because we allow the all; we skip values that are on the allow list
  if object.tags.shop
      or ShoppingAllowedListWithCategories[object.tags.amenity]
      or ShoppingAllowedListWithCategories[object.tags.tourism]
  then
    return true
  end

  -- We skip values that we explicitly desided to ignore:
  local skip_list_amenity = Set({
    "adult_gaming_centre",
    "animal_breeding",
    "animal_shelter",
    "archive",
    "ash_tray",
    "atm",
    "baby_hatch",
    "baking_oven",
    "bench",
    "bicycle_parking",
    "bicycle_repair_station",
    "binoculars",
    "brothel",
    "bus_station",
    "car_sharing",
    "charging_station",
    "clock",
    "compressed_air",
    "construction",
    "coworking_space",
    "crematorium",
    "dressing_room",
    "drinking_water",
    "DRK",
    "feeding_place",
    "ferry_terminal",
    "fire_station",
    "first_aid",
    "Fischzuchtanlage",
    "fountain",
    "funeral_hall",
    "give_box",
    "grave_yard",
    "grit_bin",
    "hookah_lounge",
    "hunting_stand",
    "kitchen",
    "kneipp_water_cure",
    "lamp",
    "letter_box",
    "loading_dock",
    "loading_ramp",
    "lounger",
    "luggage_locker",
    "mobile_library",
    "mobility_hub",
    "motorcycle_parking",
    "nest_box",
    "nursing_home",
    "parcel_locker",
    "parish_hall",
    "parking_entrance",
    "parking_space",
    "parking",
    "photo_booth",
    "planetarium",
    "police",
    "post_box",
    "proposed",
    "public_bookcase",
    "pushchair_parking",
    "reception_desk",
    "recycling",
    "sanitary_dump_station",
    "shelter",
    "shower",
    "small_electric_vehicle_parking",
    "smoking_area",
    "stripclub",
    "studio",
    "swingerclub",
    "table",
    "taxi",
    "telephone",
    "ticket_validator",
    "toilets",
    "trolley_bay",
    "vacuum_cleaner",
    "vending_any",
    "vending_cigarette",
    "vending_machine;waste_basket",
    "vending_machine",
    "washing_machine",
    "waste_basket;vending_machine",
    "waste_basket",
    "waste_disposal",
    "waste_transfer_station",
    "water_point",
    "water",
    "watering_place",
    "workshop",
    "yes",
    "todo",
    "barrier",
    "warehouse",
    "closed",
    "cooking_school",
    "seat",
  })
  if skip_list_amenity[object.tags.amenity] then
    return true
  end
  local skip_list_tourism = Set({
    "wilderness_hut",
    "guest_house",
    "gallery",
    "chalet",
    "artwork",
    "apartment",
    "alpine_hut",
    "trail_riding_station",
    "wine_cellar",
    "no",
    "yes"
  })
  if skip_list_tourism[object.tags.tourism] then
    return true
  end

  return false
end

-- Tag processing extracted to be used inside projcess_*
local function processTags(tags)
  local results = InferAddress(tags)
  local tags_cc = { "name", "amenity", "tourism" }
  CopyTags(results, tags, tags_cc)

  if (tags.amenity) then
    results.taginfo_url = "https://taginfo.openstreetmap.org/tags/amenity=" .. tags.amenity
  end
  if (tags.tourism) then
    results.taginfo_url = "https://taginfo.openstreetmap.org/tags/tourism=" .. tags.tourism
  end
  return results
end

function osm2pgsql.process_node(object)
  if ExitProcessing(object) then return end

  table:insert({
    value_to_check = object.tags.amenity or object.tags.shop or object.tags.tourism,
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_point()
  })
end

function osm2pgsql.process_way(object)
  if ExitProcessing(object) or not object.is_closed then
    return
  end

  table:insert({
    value_to_check = object.tags.amenity or object.tags.shop or object.tags.tourism,
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_polygon():centroid()
  })
end

function osm2pgsql.process_relation(object)
  if ExitProcessing(object) then return end
  -- Only process multipolygon relations to avoid inserting relations with NULL geometry
  if object.tags.type ~= 'multipolygon' then return end

  table:insert({
    value_to_check = object.tags.amenity or object.tags.shop or object.tags.tourism,
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_multipolygon():centroid()
  })
end
