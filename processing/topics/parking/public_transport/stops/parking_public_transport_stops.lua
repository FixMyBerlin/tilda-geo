local log = require('topics.helper.log')
local merge_table = require('topics.helper.merge_table')
local categorize_public_transport_stops = require('topics.parking.public_transport.stops.helper.categorize_public_transport_stops')
local LOG_ERROR = require('topics.parking.errors.parking_errors')
local result_tags = require('topics.parking.public_transport.stops.helper.result_tags')

local function parking_public_transport_stops(object, db_table)
  if next(object.tags) == nil then return end

  local result = categorize_public_transport_stops(object)
  if result.object then
    local row_data, replaced_tags = result_tags(result)
    local row = merge_table({ geom = result.object:as_point() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_public_transport_stops')
    db_table:insert(row)
  end
end

return parking_public_transport_stops
