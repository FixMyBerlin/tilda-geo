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
require("BikeLaneGeneralization")
require("MergeTable")
require("CopyTags")
require("Clone")
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
local transform_construction_prefix = require('transform_construction_prefix')
local round = require('round')
local load_csv_mapillary_coverage = require('load_csv_mapillary_coverage')
local mapillary_coverage = require('mapillary_coverage')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')

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
  local raw_tags = object.tags
  local object_tags = StructuredClone(raw_tags)

  -- ====== (A) Filter-Guards ======
  if not object_tags.highway then return end

  -- Skip stuff like "construction" (some), "proposed", "platform" (Haltestellen), "rest_area" (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
  local allowed_highways = JoinSets({ HighwayClasses, MajorRoadClasses, MinorRoadClasses, PathClasses })
  if allowed_highways[object_tags.construction] then
    -- Transform `highway=construction + construction=ALLOW_LIST`. Only data with missing `construction=*` is skipped.
    object_tags.highway = object_tags.construction
    object_tags.lifecycle = 'construction'
    object_tags.construction = nil
  end
  if not allowed_highways[object_tags.highway] then return end

  local excludeHighway = ExcludeHighways(object_tags)
  if excludeHighway then return end

  -- Skip any area. See https://github.com/FixMyBerlin/private-issues/issues/1038 for more.
  if object_tags.area == 'yes' then return end

  -- ====== (B.1) Initialize and apply pseudo tags ======
  local mapillary_coverage_lines = mapillary_coverage_data:get()
  local mapillary_coverage_value = mapillary_coverage(mapillary_coverage_lines, object.id)

  -- ====== (B.2) General conversions ======
  ConvertCyclewayOppositeSchema(object_tags)
  transform_construction_prefix(object_tags)
  -- Calculate and format length, see also https://github.com/osm2pgsql-dev/osm2pgsql/discussions/1756#discussioncomment-3614364
  -- Use https://epsg.io/5243 (same as `presenceStats.sql`); update `atlas_roads--length--tooltip` if changed.
  local length = round(object:as_linestring():transform(5243):length(), 2)

  -- ====== (C) Compute results and insert ======
  local road_result_tags = {
    name = object_tags.name or object_tags.ref or object_tags['is_sidepath:of:name'] or object_tags['street:name'],
    length = length,
    lifecycle = object_tags.lifecycle or SANITIZE_ROAD_TAGS.temporary(object_tags),
    mapillary_coverage = mapillary_coverage_value,
    mapillary = object_tags.mapillary,
    mapillary_forward = object_tags['mapillary:forward'],
    mapillary_backward = object_tags['mapillary:backward'],
    mapillary_traffic_sign = object_tags['source:traffic_sign:mapillary'],
    description = object_tags.description or object_tags.note,
  }
  MergeTable(road_result_tags, RoadClassification(object_tags))
  MergeTable(road_result_tags, Lit(object_tags))
  MergeTable(road_result_tags, SurfaceQuality(object_tags))

  -- (C.1a) WRITE `bikelanes` table
  -- (C.1b) WRITE `todoLiniesTable` table for bikelanes
  local cycleways = Bikelanes(object_tags, object)
  for _, cycleway in ipairs(cycleways) do
    if cycleway._infrastructureExists then
      local cycleway_result_tags = {
        name = road_result_tags.name,
        road = road_result_tags.road,
        length = length,
        mapillary_coverage = mapillary_coverage_value,
        mapillary = cycleway.mapillary or road_result_tags.mapillary,
        mapillary_forward = cycleway.mapillary_forward or road_result_tags.mapillary_forward,
        mapillary_backward = cycleway.mapillary_backward or road_result_tags.mapillary_backward,
        mapillary_traffic_sign = cycleway.mapillary_traffic_sign or road_result_tags.mapillary_traffic_sign,
        description = cycleway.description or road_result_tags.description,
        _parent_highway = cycleway._parent_highway
      }
      local meta = Metadata(object)

      bikelanesTable:insert({
        id = cycleway._id,
        tags = MergeTable(ExtractPublicTags(cycleway), cycleway_result_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = BikeLaneGeneralization(object_tags, cycleway_result_tags)
      })

      if next(cycleway._todo_list) ~= nil then
        local todo_meta = {
          todos = cycleway.todos,
          category = cycleway.category,
          mapillary_coverage = mapillary_coverage_value,
        }
        todoLiniesTable:insert({
          id = cycleway._id,
          table = 'bikelanes',
          tags = cycleway._todo_list,
          meta = MergeTable(todo_meta, meta),
          length = math.floor(cycleway_result_tags.length),
          geom = object:as_linestring(),
          minzoom = 0
        })
      end
    end
  end

  -- (C.2) WRITE `presence` table
  local presence = BikelanesPresence(object_tags, cycleways)
  if presence ~= nil and
    (presence.bikelane_left ~= "not_expected"
    or presence.bikelane_right ~= "not_expected"
    or presence.bikelane_self ~= "not_expected") then
    bikelanesPresenceTable:insert({
      id = DefaultId(object),
      tags = presence,
      meta = Metadata(object),
      geom = object:as_linestring(),
      minzoom = 0
    })
  end

  if not (PathClasses[object_tags.highway] or object_tags.highway == 'pedestrian') then
    MergeTable(road_result_tags, Maxspeed(object))
  end
  MergeTable(road_result_tags, presence)
  local todos = CollectTodos(RoadTodos, object_tags, road_result_tags)
  road_result_tags._todo_list = ToTodoTags(todos)
  road_result_tags.todos = ToMarkdownList(todos)

  -- We need sidewalk for Biklanes(), but not for `roads`
  if not IsSidepath(object_tags) then
    local meta = Metadata(object)

    -- (C.3) WRITE `bikeSuitability` table
    local bikeSuitability = CategorizeBikeSuitability(object_tags)
    if bikeSuitability then
      local bike_suitability_tags = {
        bikeSuitability = bikeSuitability.id,
      }
      MergeTable(bike_suitability_tags, road_result_tags)

      bikeSuitabilityTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(bike_suitability_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = 0
      })
    end

    -- (C.4a) WRITE `roads` table
    if PathClasses[object_tags.highway] then
      roadsPathClassesTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(road_result_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = PathsGeneralization(object_tags, road_result_tags)
      })
    else
      -- The `ref` (e.g. "B 264") is used in your map style and only relevant for higher road classes.
      road_result_tags.name_ref = object_tags.ref
      roadsTable:insert({
        id = DefaultId(object),
        tags = ExtractPublicTags(road_result_tags),
        meta = meta,
        geom = object:as_linestring(),
        minzoom = RoadGeneralization(object_tags, road_result_tags)
      })
    end

    -- (C.4b) WRITE `todoLiniesTable` table for roads
    if next(road_result_tags._todo_list) ~= nil then
      local todo_meta = {
        todos = road_result_tags.todos,
        category = road_result_tags.category,
        mapillary_coverage = mapillary_coverage_value,
      }
      todoLiniesTable:insert({
        id = DefaultId(object),
        table = "roads",
        tags = road_result_tags._todo_list,
        meta = MergeTable(todo_meta, meta),
        length = math.floor(road_result_tags.length),
        geom = object:as_linestring(),
        minzoom = 0
      })
    end
  end
end
