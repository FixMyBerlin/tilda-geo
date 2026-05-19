local SET = require('topics.helper.sets')

---@param original_tags table
---@param result_tags table
---@return integer
--- Return the minzoom for paths
local function paths_generalization(original_tags, result_tags)
  -- highway=path and length < 1k  only from zoom 13
  if original_tags.highway == 'path' and result_tags.length < 1000 then
    return 13
  end
  -- highway=track and not trackgrade=grade1|grade2 only from zoom 11 and below

  if original_tags.highway == 'track' and not SET.set({ 'grade1', 'grade2' })[original_tags.tracktype] then
    return 11
  end
  return 0
end

return paths_generalization
