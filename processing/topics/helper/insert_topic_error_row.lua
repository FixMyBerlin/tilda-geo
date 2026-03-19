require('init')
local default_id = require('default_id')
local TOPIC_ERROR_INSTRUCTIONS = require('topic_error_instructions')

local function insert_topic_error_row(
  db_table,
  object_or_type,
  object_id_or_geom,
  geom_or_tags,
  tags_or_caller_name,
  caller_name_or_error_type,
  error_type_or_instruction,
  instruction
)
  local object_type
  local object_id
  local geom
  local tags
  local caller_name
  local error_type

  if type(object_or_type) == 'table' then
    object_type = object_or_type.type
    object_id = object_or_type.id
    geom = object_id_or_geom
    tags = geom_or_tags
    caller_name = tags_or_caller_name
    error_type = caller_name_or_error_type
    instruction = error_type_or_instruction
  else
    object_type = object_or_type
    object_id = object_id_or_geom
    geom = geom_or_tags
    tags = tags_or_caller_name
    caller_name = caller_name_or_error_type
    error_type = error_type_or_instruction
  end

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
    id = default_id(object_type, object_id),
    geom = point_geom,
    tags = error_tags,
    meta = {},
    minzoom = 0,
  })
end

return insert_topic_error_row
