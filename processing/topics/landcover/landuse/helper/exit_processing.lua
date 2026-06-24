local allowed = require('topics.landcover.landuse.helper.allowed_values')

-- Convention gate (like the other topics' exit_processing.lua): skip objects that are not an
-- allowed land-use area. The allowed value sets and the matched-value logic live in
-- allowed_values.lua, which result_tags.lua also uses, so the filter and the stored value agree.
---@param object table
local function exit_processing(object)
  return allowed.matched_value(object.tags) == nil
end

return exit_processing
