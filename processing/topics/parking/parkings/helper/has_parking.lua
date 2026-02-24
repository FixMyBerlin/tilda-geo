require('init')
require('Set')
require('Log')
local sanitize_cleaner = require('sanitize_cleaner')
local is_road = require('is_road')
local is_driveway = require('is_driveway')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

function has_parking_tags(tags)
  -- TODO @Supaplex030: Include 'yes' because we need to transform it…
  -- TODO @Supaplex030: Exclude 'no' because that might be over-tagging and we don't want to promote it to parking-infrastructure?

  local both = sanitize_cleaner.remove_disallowed_value(SANITIZE_PARKING_TAGS.parking(tags['parking:both']))
  local left = sanitize_cleaner.remove_disallowed_value(SANITIZE_PARKING_TAGS.parking(tags['parking:left']))
  local right = sanitize_cleaner.remove_disallowed_value(SANITIZE_PARKING_TAGS.parking(tags['parking:right']))
  if both ~= nil or left ~= nil or right ~= nil then
    return true
  end
  return false
end

local function has_parking(tags)
  -- We don't expect parking on those highways.
  -- We still need them in is_road (not is_driveway) to create intersection corners etc.
  local highway_is_road_parking_optional = Set({ 'pedestrian', 'motorway_link' })
  if highway_is_road_parking_optional[tags.highway] then
    return has_parking_tags(tags)
  end

  -- We expect explict parking tagging on roads.
  -- Either parking allowed in some form; or explicitly disallowed; or missing.
  if is_road(tags) then
    return true
  end

  -- We only include driveways with explicit parking tagging.
  -- However 'yes' and other values are not considered explicit.
  if is_driveway(tags) then
    return has_parking_tags(tags)
  end

  return false
end

return has_parking
