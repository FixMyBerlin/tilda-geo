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
require("round")
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
  local object_tags = object.tags

  -- ====== (A) Filter-Guards ======
  if not object_tags.highway then return end

  -- Skip stuff like "construction", "proposed", "platform" (Haltestellen), "rest_area" (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
  local allowed_highways = JoinSets({ HighwayClasses, MajorRoadClasses, MinorRoadClasses, PathClasses })
  if not allowed_highways[object_tags.highway] then return end

  local excludeHighway = ExcludeHighways(object_tags)
  if excludeHighway then return end

  -- Skip any area. See https://github.com/FixMyBerlin/private-issues/issues/1038 for more.
  if object_tags.area == 'yes' then return end

  -- ====== (B.1) Initialize and apply pseudo tags ======
  local mapillary_coverage_lines = mapillary_coverage_data:get()
  object_tags.mapillary_coverage = mapillary_coverage(mapillary_coverage_lines, object.id)

  -- ====== (B.2) General conversions ======
  ConvertCyclewayOppositeSchema(object_tags)
  -- Calculate and format length, see also https://github.com/osm2pgsql-dev/osm2pgsql/discussions/1756#discussioncomment-3614364
  -- Use https://epsg.io/5243 (same as `presenceStats.sql`); update `atlas_roads--length--tooltip` if changed.
  local length = round(object:as_linestring():transform(5243):length(), 2)

  -- ====== (C) Compute results and insert ======
  local result_tags = {
    name = object_tags.name or object_tags.ref or object_tags['is_sidepath:of:name'],
    length = length,
    mapillary_coverage = object_tags.mapillary_coverage,
  }

  MergeTable(result_tags, RoadClassification(object))
  MergeTable(result_tags, Lit(object))
  MergeTable(result_tags, SurfaceQuality(object))

  -- (C.1a) WRITE `bikelanes` table
  -- (C.1b) WRITE `todoLiniesTable` table for bikelanes
  local cycleways = Bikelanes(object)
  local cycleway_road_tags = {
    name = result_tags.name,
    length = length,
    road = result_tags.road,
    mapillary_coverage = object_tags.mapillary_coverage,
  }
  for _, cycleway in ipairs(cycleways) do
    if cycleway._infrastructureExists then
      local public_tags = ExtractPublicTags(cycleway)
      public_tags._parent_highway = cycleway._parent_highway
      local meta = Metadata(object)
      -- meta.age = cycleway._age

      cycleway.segregated = nil -- no idea why that is present in the inspector frontend for way 9717355
      bikelanesTable:insert({
        id = cycleway._id,
        tags = MergeTable(public_tags, cycleway_road_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = 0
      })

      if next(cycleway._todo_list) ~= nil then
        meta.todos = public_tags.todos
        meta.category = public_tags.category
        todoLiniesTable:insert({
          id = cycleway._id,
          table = 'bikelanes',
          tags = cycleway._todo_list,
          meta = MergeTable(meta, { mapillary_coverage = object_tags.mapillary_coverage }),
          length = math.floor(cycleway_road_tags.length),
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

  if not (PathClasses[object_tags.highway] or object_tags.highway == 'pedestrian') then
    MergeTable(cycleway_road_tags, Maxspeed(object))
  end
  MergeTable(cycleway_road_tags, presence)
  local todos = CollectTodos(RoadTodos, object_tags, cycleway_road_tags)
  cycleway_road_tags._todo_list = ToTodoTags(todos)
  cycleway_road_tags.todos = ToMarkdownList(todos)

  -- We need sidewalk for Biklanes(), but not for `roads`
  if not IsSidepath(object_tags) then
    local meta = Metadata(object)

    MergeTable(meta, {
      age = AgeInDays(ParseCheckDate(object_tags["check_date"])),
      -- surface_age = results._surface_age,
      -- smoothness_age = results._smoothness_age,
      -- maxspeed_age = results._maxspeed_age, -- unused
      -- lit_age = results._lit_age -- unused
    })

    -- (C.3) WRITE `bikeSuitability` table
    local bikeSuitability = CategorizeBikeSuitability(object_tags)
    if bikeSuitability then
      local bike_suitability_tags = {
        bikeSuitability = bikeSuitability.id,
        traffic_sign = cycleway_road_tags.traffic_sign,
      }
      MergeTable(bike_suitability_tags, cycleway_road_tags)
      MergeTable(bike_suitability_tags, RoadClassification(object))
      MergeTable(bike_suitability_tags, SurfaceQuality(object))

      bikeSuitabilityTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(bike_suitability_tags),
        meta = Metadata(object),
        geom = object:as_linestring(),
        minzoom = 0
      })
    end

    -- (C.4a) WRITE `roads` table
    if PathClasses[object_tags.highway] then
      roadsPathClassesTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(cycleway_road_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = PathsGeneralization(object_tags, cycleway_road_tags)
      })
    else
      -- The `ref` (e.g. "B 264") is used in your map style and only relevant for higher road classes.
      cycleway_road_tags.name_ref = object_tags.ref
      roadsTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(cycleway_road_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = RoadGeneralization(object_tags, cycleway_road_tags)
      })
    end

    -- (C.4b) WRITE `todoLiniesTable` table for roads
    if next(cycleway_road_tags._todo_list) ~= nil then
      meta.road = cycleway_road_tags.road
      meta.todos = cycleway_road_tags.todos
      todoLiniesTable:insert({
        id = DefaultId(object),
        table = "roads",
        tags = cycleway_road_tags._todo_list,
        meta = MergeTable(meta, { mapillary_coverage = object_tags.mapillary_coverage }),
        length = math.floor(cycleway_road_tags.length),
        geom = object:as_linestring(),
        minzoom = 0
      })
    end
  end
end
