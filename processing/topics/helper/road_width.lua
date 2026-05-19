local parse_length = require('topics.helper.parse_length')

-- * @desc TODO
-- * @returns TODO
local function road_width(tags)
  local width = tags['width'] or tags['est_width']
  if width then
    width = parse_length(width)
    if width then return width end
  end

  local street_widths = {
    primary = 10,
    secondary = 8,
    tertiary = 6,
    residential = 6,
  }
  if street_widths[tags['highway']] then
    return street_widths[tags['highway']]
  end

  return 8
end

return road_width
