-- Reverse of `unnest_parking_tags` for logging: find the original `parking:<side|both>:<key>` that provided `value`.
-- Same precedence as `transform_parkings`: `parking:SIDE:key` > `parking:both:key` > `parking:key`.
---@param parent_tags table Original way tags
---@param side 'left'|'right'
---@param key string Unnested key, e.g. `restriction:conditional`
---@param value string
---@return string
local function nested_parking_key(parent_tags, side, key, value)
  for _, infix in ipairs({ ':' .. side, ':both', '' }) do
    -- `parking:left=lane` is unnested to `parking=lane`
    local nested_key = key == 'parking' and ('parking' .. infix) or ('parking' .. infix .. ':' .. key)
    if parent_tags[nested_key] == value then
      return nested_key
    end
  end
  return key
end

return nested_parking_key
