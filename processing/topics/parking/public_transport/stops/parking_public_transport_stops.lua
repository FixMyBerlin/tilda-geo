require('init')
require('Log')
require('MergeTable')
local categorize_public_transport_stops = require('categorize_public_transport_stops')
local LOG_ERROR = require('parking_errors')
local result_tags_public_transport_stops = require('result_tags_public_transport_stops')

local function parking_public_transport_stops(object, db_table)
  if next(object.tags) == nil then return end

  local result = categorize_public_transport_stops(object)
  if result.object then
    local row_data, replaced_tags = result_tags_public_transport_stops(result)
    local row = MergeTable({ geom = result.object:as_point() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_public_transport_stops')
    db_table:insert(row)
  end
end

return parking_public_transport_stops
