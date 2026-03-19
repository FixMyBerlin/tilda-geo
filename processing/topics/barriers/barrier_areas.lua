require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('barriers_errors')
local result_tags_barriers = require('result_tags_barriers')

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

local function preprocess_barrier_areas(object)
  local tags = object.tags
  tags._computed_area = nil
  tags._computed_circumference = nil

  if tags.natural ~= 'water' then
    return
  end

  tags._computed_area = object:as_multipolygon():transform(5243):area()
  if object.type == 'way' then
    tags._computed_circumference = object:as_linestring():transform(5243):length()
  end
end

local function exit_processing_barrier_areas(object)
  if object.type == 'way' and not object.is_closed then
    return true
  end

  local tags = object.tags
  local is_barrier = false

  if tags.natural == 'water' then
    local area = tags._computed_area
    -- TODO: check this against individual polygons in multipolygons.
    if area and area > 100000 then
      is_barrier = true
    elseif object.type == 'way' then
      local circumference = tags._computed_circumference
      if circumference and circumference > 1000 then
        is_barrier = is_barrier or (area / circumference) < 3
        is_barrier = true
      end
    end
  end

  is_barrier = is_barrier or tags.aeroway == 'aerodrome'
  return not is_barrier
end

local function barrier_areas(object)
  preprocess_barrier_areas(object)
  if exit_processing_barrier_areas(object) then
    return
  end

  local cleaned_tags, replaced_tags = result_tags_barriers(object.tags)
  local geom = object:as_multipolygon()
  local caller_name = object.type == 'relation' and 'barrier_areas_relation' or 'barrier_areas_way'
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, caller_name)
  db_table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
end

return barrier_areas
