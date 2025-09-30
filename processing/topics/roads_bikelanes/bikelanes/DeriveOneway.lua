require('init')
require("Set")
require("Sanitize")

---@param category table
---@return 'yes' | 'no' | 'car_not_bike' | 'assumed_no' | 'implicit_yes'
--- Derive oneway information based on tags and given category
function DeriveOneway(tags, category)
  -- if `oneway:bicycle` is explicitly tagged check if it differs from `oneway`
  if tags['oneway:bicycle'] == 'yes' then
    return 'yes'
  elseif tags['oneway:bicycle'] == 'no' then
    if tags.oneway == 'yes' then
      return 'car_not_bike'
    else
      return 'no'
    end
  end

  if Sanitize(tags.oneway, { 'yes', 'no' }) then
    return tags.oneway
  end

  -- Special treatment for `category=footAndCyclewayShared_isolated`
  if tags.highway == 'service' or tags.highway == 'track' then
    return 'assumed_no'
  end

  if category.implicitOneWay then
    return 'implicit_yes'
  end

  return 'assumed_no'
end
