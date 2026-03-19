require('init')

local function default_id(object_or_type, object_id)
  if object_id ~= nil then
    return string.lower(object_or_type) .. '/' .. object_id
  end

  return string.lower(object_or_type.type) .. '/' .. object_or_type.id
end

return default_id
