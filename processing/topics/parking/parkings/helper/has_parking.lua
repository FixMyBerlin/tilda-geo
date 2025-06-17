require('init')
require('Set')
require('Log')
local is_road = require('is_road')
local is_driveway = require('is_driveway')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_VALUES = require('sanitize_values')

function has_parking_tags(tags)
  -- TODO @Supaplex030: Include 'yes' because we need to transform it…
  -- TODO @Supaplex030: Exclude 'no' because that might be over-tagging and we don't want to promote it to parking-infrastructure?

  local both = SANITIZE_TAGS.parking(tags['parking:both'])
  local left = SANITIZE_TAGS.parking(tags['parking:left'])
  local right = SANITIZE_TAGS.parking(tags['parking:right'])
  if (
    (both ~= nil and both ~= SANITIZE_VALUES.disallowed) or
    (left ~= nil and left ~= SANITIZE_VALUES.disallowed) or
    (right ~= nil and right ~= SANITIZE_VALUES.disallowed)
  ) then
    return true
  end
  return false
end

local function has_parking(tags)

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
