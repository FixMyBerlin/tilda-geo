local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.barriers.barriers_errors')
local result_tags = require('topics.barriers.helper.result_tags')
local minzoom = require('topics.barriers.helper.minzoom')
local compact_area = require('topics.barriers.helper.compact_area')

local db_table = osm2pgsql.define_table({
  name = 'barrierAreas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multipolygon' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true }
  }
})

--- Sets internal `_`-prefixed tags used by result_tags and minzoom.
---@param object OsmObject
local function prepare_barrier_area_tags(object)
  local tags = object.tags
  tags._computed_area = nil
  tags._is_compact_water = nil

  if tags.natural ~= 'water' then
    return
  end

  local area = object:as_multipolygon():transform(5243):area()
  local perimeter = nil
  if object.type == 'way' then
    perimeter = object:as_linestring():transform(5243):length()
  end

  tags._computed_area = area
  tags._is_compact_water = compact_area.is_compact_water(area, perimeter)
end

---@param object OsmObject
---@return boolean
local function exit_processing_barrier_areas(object)
  if object.type == 'way' and not object.is_closed then
    return true
  end

  local tags = object.tags

  if tags.aeroway == 'aerodrome' then
    return false
  end

  if tags.natural == 'water' then
    local area = tags._computed_area
    return not area or area < compact_area.MIN_AREA_Z10
  end

  return true
end

local function barrier_areas(object)
  prepare_barrier_area_tags(object)
  if exit_processing_barrier_areas(object) then
    return
  end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_multipolygon()
  local caller_name = object.type == 'relation' and 'barrier_areas_relation' or 'barrier_areas_way'
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, caller_name)
  db_table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(object.tags),
    id = default_id(object),
  })
end

return barrier_areas
