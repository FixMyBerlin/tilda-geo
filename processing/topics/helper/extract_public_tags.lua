--- extract all key, value pairs that are not starting with `_`
---@param tags OsmTags
---@return OsmTags
local function extract_public_tags(tags)
  local public_tags = {}
  for k, v in pairs(tags) do -- remove internal tags starting with '_'
    if not k:match('^_') then
      public_tags[k] = v
    end
  end
  return public_tags
end

return extract_public_tags
