local SET = require('topics.helper.sets')

---@param tags OsmTags
---@param category table
---@return 'yes'|'no'|'car_not_bike'|'assumed_no'|'implicit_yes'
local function derive_oneway(tags, category)
  if tags['oneway:bicycle'] == 'yes' then
    return 'yes'
  elseif tags['oneway:bicycle'] == 'no' then
    if tags.oneway == 'yes' then
      return 'car_not_bike'
    else
      return 'no'
    end
  end

  if tags.oneway and SET.set({ 'yes', 'no' })[tags.oneway] then
    return tags.oneway
  end

  if tags.highway == 'service' or tags.highway == 'track' then
    return 'assumed_no'
  end

  if category.implicitOneWay then
    return 'implicit_yes'
  end

  return 'assumed_no'
end

return derive_oneway
