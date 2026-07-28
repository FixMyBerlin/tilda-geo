local default_id = require('topics.helper.default_id')
local TOPIC_ERROR_INSTRUCTIONS = require('topics.helper.topic_error_instructions')

---@param db_table table
---@param object_type string
---@param object_id number|string
---@param geom table
---@param tags OsmTags|nil
---@param caller_name string
---@param error_type string
---@param instruction string|nil
local function insert_topic_error_row(
  db_table,
  object_type,
  object_id,
  geom,
  tags,
  caller_name,
  error_type,
  instruction
)

  if error_type == TOPIC_ERROR_INSTRUCTIONS.SANITIZED_VALUE.key and (not tags or next(tags) == nil) then
    return
  end

  local point_geom = nil
  if object_type == 'node' then
    point_geom = geom
  end
  if object_type == 'way' then
    -- It is OK to pass in a point_geom here
    point_geom = geom:centroid()
  end
  if object_type == 'relation' then
    -- It is OK to pass in a point_geom here
    point_geom = geom:centroid()
  end

  local error_tags = {}
  if tags then
    for k, v in pairs(tags) do
      error_tags[k] = v
    end
  end

  error_tags._caller_name = caller_name
  error_tags._error_type = error_type
  error_tags._instruction = instruction

  db_table:insert({
    id = default_id({ type = object_type, id = object_id, }),
    geom = point_geom,
    tags = error_tags,
    meta = {},
    minzoom = 0,
  })
end

return insert_topic_error_row
