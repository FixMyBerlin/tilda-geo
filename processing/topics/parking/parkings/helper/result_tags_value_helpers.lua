require('init')
require("Log")
require("Sanitize")
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

-- `parking` is our main tag.
-- for is_driveway this is alway some precise value (because everything else is excluded)
-- for is_road this with either "missing" or some precise value.
-- except for dual_carriageway|s when we fall back to "not_expected" instead of "missing"
function parking_value(object)
  -- We allow "yes" as unspecified value for edge cases when the position is not yet know
  local result = SANITIZE_PARKING_TAGS.parking(object.tags.parking)
  if (object._parent_tags.dual_carriageway == "yes") then
    result = result or 'not_expected'
  end
  result = result or "missing"
  return result
end
