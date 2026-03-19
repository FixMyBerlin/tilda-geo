require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('landuse_errors')
local landuse_tables = require('landuse_tables')
local exit_processing_landuse = require('exit_processing_landuse')
local result_tags_landuse = require('result_tags_landuse')

local table = landuse_tables.table

local function landuse_ways(object)
  if exit_processing_landuse(object) or not object.is_closed then
    return
  end

  local cleaned_tags, replaced_tags = result_tags_landuse(object.tags)
  local geom = object:as_polygon()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'landuse_way')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
end

return landuse_ways
