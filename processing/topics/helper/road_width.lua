local parse_width = require('topics.helper.parse_width')

-- * @desc TODO
-- * @returns TODO
local function road_width(tags)
  local width = parse_width(tags['width']) or parse_width(tags['est_width'])
  if width then return width end

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
