require('init')
require("Set")
require("Log")
require("is_road")
require("is_driveway")
require("Sanitize")

function has_parking(tags)
  -- We expect explict parking tagging on roads.
  -- Either parking allowed in some form; or explicitly disallowed; or missing.
  if is_road(tags) then
    return true
  end

  -- We only include driveways with explicit parking tagging.
  -- However "yes" and other values are not considered explicit.
  if is_driveway(tags) then
    local allowed_values = {"no", "lane", "street_side", "on_kerb", "half_on_kerb", "shoulder", "separate"}
    local both = Sanitize(tags['parking:both'], allowed_values)
    local left = Sanitize(tags['parking:left'], allowed_values)
    local right = Sanitize(tags['parking:right'], allowed_values)
    if(both or left or right) then
      return true
    end
  end

  return false
end
