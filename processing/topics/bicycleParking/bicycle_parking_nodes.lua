local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.bicycleParking.bicycleParking_errors')
local result_tags = require('topics.bicycleParking.helper.result_tags')
local kind_parts = require('topics.bicycleParking.helper.kind_parts')
local parts_rows = require('topics.bicycleParking.helper.insert_bicycle_parking_parts')

local function process_node(object)
  local parts = kind_parts(object.tags)
  if #parts == 0 then return end

  local shared_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'bicycleParking_node')

  parts_rows.points(parts, shared_tags, metadata(object), geom, default_id(object), 'point_offset')
end

return process_node
