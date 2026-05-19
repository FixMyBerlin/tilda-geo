local log = require('topics.helper.log')
local SET = require('topics.helper.sets')

-- unnest all tags from `['prefix .. side:subtag']=val` -> `['subtag']=val`
---@param raw_tags table
---@param infix string infix to look for either a side e.g. `:left`, `:right`, `:both` or `''`
---@param dest table
---@return table
local function unnest_parking_tags(raw_tags, infix, dest)
  if (not SET.set({ ':left', ':right', ':both', '' })[infix]) then return dest end

  local fullPrefix = 'parking' .. infix
  local prefixLen = string.len(fullPrefix)
  for key, val in pairs(raw_tags) do
    if osm2pgsql.has_prefix(key, fullPrefix) then
      if key == fullPrefix then
        -- Handle `parking:SIDE=`
        dest['parking'] = val
      else
        -- Handle `parking:SIDE:subkey=`
        -- offset of 2 due to 1-indexing and for removing the ':'
        local prefixlessKey = string.sub(key, prefixLen + 2)
        local subkey = string.match(prefixlessKey, '[^:]*')
        -- make sure that `subkey` is not an infix
        if infix ~= '' or not SET.set({ 'left', 'right', 'both' })[subkey] then
          dest[prefixlessKey] = val
        end
      end
    end
  end

  return dest
end

return unnest_parking_tags
