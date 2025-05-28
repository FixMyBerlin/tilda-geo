require('init')
require("Set")
require("JoinSets")
require("Metadata")
require("ExcludeHighways")
require("ExcludeByWidth")
require("ConvertCyclewayOppositeSchema")
require("Maxspeed")
require("Lit")
require("RoadClassification")
require("RoadGeneralization")
require("SurfaceQuality")
require("Bikelanes")
require("BikelanesPresence")
require("MergeTable")
require("CopyTags")
require("IsSidepath")
require("ExtractPublicTags")
require("Round")
require("DefaultId")
require("PathsGeneralization")
require("RoadTodos")
require("CollectTodos")
require("ToMarkdownList")
require("ToTodoTags")
require("BikeSuitability")
require("Log")
local round = require('round')
local load_csv_mapillary_coverage = require('load_csv_mapillary_coverage')
local mapillary_coverage = require('mapillary_coverage')

local roadsTable = osm2pgsql.define_table({
  name = 'roads',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local roadsPathClassesTable = osm2pgsql.define_table({
  name = 'roadsPathClasses',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local bikelanesTable = osm2pgsql.define_table({
  name = 'bikelanes',
  -- Note: We populate a custom `osm_id` (with unique ID values) below.
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local bikelanesPresenceTable = osm2pgsql.define_table({
  name = 'bikelanesPresence',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local bikeSuitabilityTable = osm2pgsql.define_table({
  name = 'bikeSuitability',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local todoLiniesTable = osm2pgsql.define_table({
  name = 'todos_lines',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'table',   type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'length',  type = 'integer' },
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = { 'id', 'table' },     method = 'btree', unique = true },
    { column = { 'tags' },            method = 'gin' }, -- locally this is not used
    { column = { 'meta' },            method = 'gin' }, -- locally this is not used
    { column = { 'length' },          method = 'btree' },
  }
})


-- ====== (B.1) Prepare pseudo tags ======
local mapillary_coverage_data = load_csv_mapillary_coverage()

function osm2pgsql.process_way(object)
  local tags = object.tags

  -- ====== (A) Filter-Guards ======
  if not tags.highway then return end

  -- Skip stuff like "construction", "proposed", "platform" (Haltestellen), "rest_area" (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
  local allowed_highways = JoinSets({ HighwayClasses, MajorRoadClasses, MinorRoadClasses, PathClasses })
  if not allowed_highways[tags.highway] then return end

  local excludeHighway, _ = ExcludeHighways(tags)
  if excludeHighway then return end

  -- Skip any area. See https://github.com/FixMyBerlin/private-issues/issues/1038 for more.
  if tags.area == 'yes' then return end

  -- ====== (B.1) Initialize pseudo tags ======
  local mapillary_coverage_rows = mapillary_coverage_data:get()

  -- ====== (B.2) General conversions ======
  ConvertCyclewayOppositeSchema(tags)
  -- Calculate and format length, see also https://github.com/osm2pgsql-dev/osm2pgsql/discussions/1756#discussioncomment-3614364
  -- Use https://epsg.io/5243 (same as `presenceStats.sql`); update `atlas_roads--length--tooltip` if changed.
  local length = round(object:as_linestring():transform(5243):length(), 2)

  -- ====== (C) Compute results and insert ======
  local results = {
    name = tags.name or tags.ref or tags['is_sidepath:of:name'],
    length = length,
    _updated_age = AgeInDays(object.timestamp)
  }

  MergeTable(results, RoadClassification(object))
  MergeTable(results, Lit(object))
  MergeTable(results, SurfaceQuality(object))

  -- (C.1a) WRITE `bikelanes` table
  -- (C.1b) WRITE `todoLiniesTable` table for bikelanes
  local cycleways = Bikelanes(object)
  local road_info = {
    name = results.name,
    length = length,
    road = results.road,
    mapillary_coverage = mapillary_coverage(mapillary_coverage_rows, object.id)
  }
  for _, cycleway in ipairs(cycleways) do
    if cycleway._infrastructureExists then
      local publicTags = ExtractPublicTags(cycleway)
      publicTags._parent_highway = cycleway._parent_highway
      local meta = Metadata(object)
      -- meta.age = cycleway._age

      cycleway.segregated = nil -- no idea why that is present in the inspector frontend for way 9717355
      bikelanesTable:insert({
        id = cycleway._id,
        tags = MergeTable(publicTags, road_info),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = 0
      })

      if next(cycleway._todo_list) ~= nil then
        meta.todos = publicTags.todos
        meta.category = publicTags.category
        todoLiniesTable:insert({
          id = cycleway._id,
          table = 'bikelanes',
          tags = cycleway._todo_list,
          meta = meta,
          length = math.floor(results.length),
          geom = object:as_linestring(),
          minzoom = 0
        })
      end
    end
  end

  -- (C.2) WRITE `presence` table
  local presence = BikelanesPresence(object, cycleways)
  if presence ~= nil and
    (presence.bikelane_left ~= "not_expected"
    or presence.bikelane_right ~= "not_expected"
    or presence.bikelane_self ~= "not_expected")then
    bikelanesPresenceTable:insert({
      id = DefaultId(object),
      tags = presence,
      meta = Metadata(object),
      geom = object:as_linestring(),
      minzoom = 0
    })
  end

  if not (PathClasses[tags.highway] or tags.highway == 'pedestrian') then
    MergeTable(results, Maxspeed(object))
  end
  MergeTable(results, presence)
  local todos = CollectTodos(RoadTodos, tags, results)
  results._todo_list = ToTodoTags(todos)
  results.todos = ToMarkdownList(todos)

  -- We need sidewalk for Biklanes(), but not for `roads`
  if not IsSidepath(tags) then
    local meta = Metadata(object)

    MergeTable(meta, {
      age = AgeInDays(ParseCheckDate(tags["check_date"])),
      -- surface_age = results._surface_age,
      -- smoothness_age = results._smoothness_age,
      -- maxspeed_age = results._maxspeed_age, -- unused
      -- lit_age = results._lit_age -- unused
    })

    -- (C.3) WRITE `bikeSuitability` table
    local bikeSuitability = CategorizeBikeSuitability(tags)
    if bikeSuitability then
      local bikeSuitabilityTags = {
        bikeSuitability = bikeSuitability.id,
        traffic_sign = results.traffic_sign,
      }
      MergeTable(bikeSuitabilityTags, road_info)
      MergeTable(bikeSuitabilityTags, RoadClassification(object))
      MergeTable(bikeSuitabilityTags, SurfaceQuality(object))

      bikeSuitabilityTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(bikeSuitabilityTags),
        meta = Metadata(object),
        geom = object:as_linestring(),
        minzoom = 0
      })
    end

    -- (C.4a) WRITE `roads` table
    if PathClasses[tags.highway] then
      roadsPathClassesTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(results),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = PathsGeneralization(tags, results)
      })
    else
      -- The `ref` (e.g. "B 264") is used in your map style and only relevant for higher road classes.
      results.name_ref = tags.ref
      roadsTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(results),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = RoadGeneralization(tags, results)
      })
    end

    -- (C.4b) WRITE `todoLiniesTable` table for roads
    if next(results._todo_list) ~= nil then
      meta.road = results.road
      meta.todos = results.todos
      todoLiniesTable:insert({
        id = DefaultId(object),
        table = "roads",
        tags = results._todo_list,
        meta = meta,
        length = math.floor(results.length),
        geom = object:as_linestring(),
        minzoom = 0
      })
    end
  end
end
