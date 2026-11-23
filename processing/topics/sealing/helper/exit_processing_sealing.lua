-- Shared early exit for all geometry modules of the `sealing` topic.
-- Returns true for objects that must not count as sealed ground at ground level, or that are not
-- in use. Private access is NOT a reason: a private way is still sealed ground.

---@param value string|nil
---@return boolean
local function present(value)
  return value ~= nil and value ~= 'no'
end

---@param tags OsmTags
---@return boolean
local function exit_processing_sealing(tags)
  -- Not at ground level
  if present(tags.bridge) or present(tags.tunnel) or present(tags.indoor) or tags.covered == 'yes' then
    return true
  end
  if tags.location == 'underground' or tags.location == 'rooftop' or tags.location == 'roof' then
    return true
  end
  -- Negative layer/level (first value of `-1;0`): passages and concourses below ground.
  for _, key in ipairs({ 'layer', 'level' }) do
    local first = tags[key] and tonumber(tags[key]:match('^%s*(-?[%d.]+)'))
    if first and first < 0 then
      return true
    end
  end
  -- Lifecycle: not (yet / any more) there. Prefixed keys (`disused:highway=*`, ...) never match
  -- `highway=*` and need no check.
  -- `construction=*` on `landuse=construction` only says what is being built, not that the area
  -- itself is not there yet.
  if present(tags.disused) or present(tags.abandoned) or present(tags.proposed) then
    return true
  end
  if present(tags.construction) and tags.landuse ~= 'construction' then
    return true
  end
  if tags.highway == 'construction' or tags.highway == 'proposed' then
    return true
  end
  return false
end

return exit_processing_sealing
