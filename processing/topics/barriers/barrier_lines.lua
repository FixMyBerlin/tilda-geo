local SET = require('topics.helper.sets')
local metadata = require('topics.helper.metadata')
local HIGHWAYS = require('topics.helper.highway_classes')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.barriers.barriers_errors')
local result_tags = require('topics.barriers.helper.result_tags')
local minzoom = require('topics.barriers.helper.minzoom')

local db_table = osm2pgsql.define_table({
  name = 'barrierLines',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'linestring' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true }
  }
})

local water_barriers = SET.set({ 'river', 'canal' })
local train_barriers = SET.set({ 'main', 'branch' })

local function exit_processing_barrier_lines(object)
  if object.type ~= 'way' or object.is_closed then
    return true
  end

  local tags = object.tags
  -- Exclude amusement rides. Example: https://www.openstreetmap.org/way/244829977
  if tags.attraction == 'amusement_ride' then
    return true
  end

  local is_barrier = HIGHWAYS.trunk_motorway_classes[tags.highway]
  -- waterways as lines are used for low zoom levels
  is_barrier = is_barrier or water_barriers[tags.waterway]
  if tags.railway == 'rail' or tags.railway == 'light_rail' then
    is_barrier = is_barrier or train_barriers[tags.usage]
  end

  return not is_barrier
end

local function barrier_lines(object)
  if exit_processing_barrier_lines(object) then
    return
  end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_linestring()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'barrier_lines')
  db_table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = default_id(object),
  })
end

return barrier_lines
