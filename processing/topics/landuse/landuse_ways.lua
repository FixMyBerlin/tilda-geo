local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.landuse.landuse_errors')
local landuse_tables = require('topics.landuse.landuse_tables')
local exit_processing = require('topics.landuse.helper.exit_processing')
local result_tags = require('topics.landuse.helper.result_tags')

local table = landuse_tables.table

local function landuse_ways(object)
  if exit_processing(object) or not object.is_closed then
    return
  end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
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
