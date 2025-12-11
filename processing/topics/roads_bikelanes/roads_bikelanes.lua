require('init')
require("Set")
require("JoinSets")
require("Metadata")
local exclude = require("exclude_highways")
require("ExcludeByWidth")
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
require('RoadClassificationRoadValue')
local transform_construction_prefix = require('transform_construction_prefix')
local transform_cycleway_both_postfix = require('transform_cycleway_both_postfix')
local transform_cycleway_opposite_schema = require('transform_cycleway_opposite_schema')
local transform_highway_path_with_foot_or_bicycle_no = require('transform_highway_path_with_foot_or_bicycle_no')
local transform_lifecycle_tags = require('transform_lifecycle_tags')
local round = require('round')
local load_csv_mapillary_coverage = require('load_csv_mapillary_coverage')
local mapillary_coverage = require('mapillary_coverage')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')

local roadsTable = osm2pgsql.define_table({
  name = 'roads',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring' },
    { column = 'minzoom', type = 'integer', not_null = true },
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
    { column = 'minzoom', type = 'integer', not_null = true },
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
    { column = 'minzoom', type = 'integer', not_null = true },
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
    { column = 'minzoom', type = 'integer', not_null = true },
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
    { column = 'minzoom', type = 'integer', not_null = true },
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
    { column = 'minzoom', type = 'integer', not_null = true },
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
  transform_lifecycle_tags(object_tags) -- needs to happen before the `exclude.by_highway_class`
  if exclude.by_highway_class(object_tags) then return end
  if exclude.by_other_tags(object_tags) then return end
  local forbidden_accesses_bikelanes = Set({ 'private', 'no', 'delivery', 'permit' })
  if exclude.by_access(object_tags, forbidden_accesses_bikelanes) then return end
  if exclude.by_service(object_tags) then return end

  -- ====== (B.1) Initialize and apply pseudo tags ======
  -- We add mapillary_coverage to object_tags so to make user it is available in `CollectTodos` down below
  local mapillary_coverage_lines = mapillary_coverage_data:get()
  object_tags.mapillary_coverage = mapillary_coverage(mapillary_coverage_lines, object.id)

  -- ====== (B.2) General mutation to our `object_tags` ======
  transform_cycleway_opposite_schema(object_tags)
  transform_construction_prefix(object_tags)
  transform_cycleway_both_postfix(object_tags)

  -- Calculate and format length, see also https://github.com/osm2pgsql-dev/osm2pgsql/discussions/1756#discussioncomment-3614364
  -- Use https://epsg.io/5243 (same as `presenceStats.sql`); update `atlas_roads--length--tooltip` if changed.
  local length = round(object:as_linestring():transform(5243):length(), 2)

  -- ====== (C) Compute results and insert ======
  local road_result_tags = {
    name = object_tags.name or object_tags.ref or object_tags['is_sidepath:of:name'] or object_tags['street:name'],
    length = length,
    lifecycle = object_tags.lifecycle or SANITIZE_ROAD_TAGS.temporary(object_tags),
    mapillary_coverage = object_tags.mapillary_coverage,
    mapillary = object_tags.mapillary,
    mapillary_forward = object_tags['mapillary:forward'],
    mapillary_backward = object_tags['mapillary:backward'],
    mapillary_traffic_sign = object_tags['source:traffic_sign:mapillary'],
    description = object_tags.description or object_tags.note,
    operator_type = SANITIZE_TAGS.operator_type(object_tags),
    informal = SANITIZE_TAGS.informal(object_tags.informal),
    covered = SANITIZE_TAGS.covered_or_indoor(object_tags),
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
        mapillary_coverage = object_tags.mapillary_coverage,
        mapillary = cycleway.mapillary or road_result_tags.mapillary,
        mapillary_forward = cycleway.mapillary_forward or road_result_tags.mapillary_forward,
        mapillary_backward = cycleway.mapillary_backward or road_result_tags.mapillary_backward,
        mapillary_traffic_sign = cycleway.mapillary_traffic_sign or road_result_tags.mapillary_traffic_sign,
        description = cycleway.description or road_result_tags.description,
        operator_type = road_result_tags.operator_type,
        informal = road_result_tags.informal,
        covered = road_result_tags.covered,
        _parent_highway = cycleway._parent_highway -- duplicated because we `ExtractPublicTags` on the other data below
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
          mapillary_coverage = object_tags.mapillary_coverage,
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


  -- == Start working on roads, roadsPathClasses Data ==
  -- === Expand the result tags ===
  if not (PathClasses[object_tags.highway] or object_tags.highway == 'pedestrian') then
    MergeTable(road_result_tags, Maxspeed(object))
  end
  MergeTable(road_result_tags, presence)
  local todos = CollectTodos(RoadTodos, object_tags, road_result_tags)
  road_result_tags._todo_list = ToTodoTags(todos)
  road_result_tags.todos = ToMarkdownList(todos)

  -- ====== Road specific mutations to our `object_tags` ======
  transform_highway_path_with_foot_or_bicycle_no(object_tags)
  -- Now we have to re-apply the road classification based on the transformed object_tags; we should refactor this…
  road_result_tags.road = RoadClassificationRoadValue(object_tags)


  -- === Exit processing ===
  -- We need sidewalks for `bikelanes`, but not for `roads*`
  if IsSidepath(object_tags) then return end
  -- Apply access filtering for roads (forbids private, no, delivery, permit, destination)
  local forbidden_accesses_roads = JoinSets({ forbidden_accesses_bikelanes, Set({ 'destination', 'customers' }) })
  if exclude.by_access(object_tags, forbidden_accesses_roads) then return end
  if exclude.by_indoor(object_tags) then return end
  if exclude.by_informal(object_tags) then return end

  -- === (C.3) WRITE `bikeSuitability` table ===
  local bikeSuitability = CategorizeBikeSuitability(object_tags)
  if bikeSuitability then
    local bike_suitability_tags = {
      bikeSuitability = bikeSuitability.id,
    }
    MergeTable(bike_suitability_tags, road_result_tags)

    bikeSuitabilityTable:insert({
      id = DefaultId(object),
      tags = ExtractPublicTags(bike_suitability_tags),
      meta = Metadata(object),
      geom = object:as_linestring(),
      minzoom = 0
    })
  end

  -- === (C.4a) WRITE `roads` table ===
  if PathClasses[object_tags.highway] then
    -- For path classes, only set bikelane_self when infrastructure exists
    for _, cycleway in ipairs(cycleways) do
      if cycleway._side == 'self' then road_result_tags['bikelane_self'] = cycleway.category end
      if cycleway._side == 'left' then road_result_tags['bikelane_left'] = cycleway.category end
      if cycleway._side == 'right' then road_result_tags['bikelane_right'] = cycleway.category end
    end

    roadsPathClassesTable:insert({
      id = DefaultId(object),
      tags = ExtractPublicTags(road_result_tags),
      meta = Metadata(object),
      geom = object:as_linestring(),
      minzoom = PathsGeneralization(object_tags, road_result_tags)
    })
  else
    -- The `ref` (e.g. "B 264") is used in your map style and only relevant for higher road classes.
    road_result_tags.name_ref = object_tags.ref
    roadsTable:insert({
      id = DefaultId(object),
      tags = ExtractPublicTags(road_result_tags),
      meta = Metadata(object),
      geom = object:as_linestring(),
      minzoom = RoadGeneralization(object_tags, road_result_tags)
    })
  end

  -- (C.4b) WRITE `todoLiniesTable` table for roads
  if next(road_result_tags._todo_list) ~= nil then
    local todo_meta = {
      todos = road_result_tags.todos,
      category = road_result_tags.category,
      mapillary_coverage = object_tags.mapillary_coverage,
    }
    todoLiniesTable:insert({
      id = DefaultId(object),
      table = "roads",
      tags = road_result_tags._todo_list,
      meta = MergeTable(todo_meta, Metadata(object)),
      length = math.floor(road_result_tags.length),
      geom = object:as_linestring(),
      minzoom = 0
    })
  end
end
