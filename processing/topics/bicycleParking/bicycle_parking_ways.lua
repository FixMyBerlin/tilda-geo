local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.bicycleParking.bicycleParking_errors')
local result_tags = require('topics.bicycleParking.helper.result_tags')
local kind_parts = require('topics.bicycleParking.helper.kind_parts')
local parts_rows = require('topics.bicycleParking.helper.insert_bicycle_parking_parts')
local insert_bicycle_parking_line = require('topics.bicycleParking.helper.insert_bicycle_parking_line')

local function process_way(object)
  local parts = kind_parts(object.tags)
  if #parts == 0 then return end

  local shared_tags, replaced_tags = result_tags(object.tags)
  local id = default_id(object)
  local meta = metadata(object)

  if object.is_closed then
    local poly = object:as_polygon()
    LOG_ERROR.SANITIZED_VALUE(object, poly, replaced_tags, 'bicycleParking_way_area')
    parts_rows.areas(parts, shared_tags, meta, poly, id)
    return
  end

  local line = object:as_linestring()
  LOG_ERROR.SANITIZED_VALUE(object, line, replaced_tags, 'bicycleParking_way_line')
  parts_rows.points(parts, shared_tags, meta, line:centroid(), id, 'line_halves')
  if #parts > 1 then
    insert_bicycle_parking_line(id, line)
  end
end

return process_way
