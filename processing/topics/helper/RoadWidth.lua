local parse_width = require('parse_width')

-- * @desc TODO
-- * @returns TODO
function RoadWidth(tags, object)
  local width_val = tags["width"]
  local tag_name = "width"
  if not width_val then
    width_val = tags["est_width"]
    tag_name = "est_width"
  end

  if width_val then
    local width = parse_width(width_val, object, tag_name)
    if width then return width end
  end

  local streetWidths = {
    primary = 10,
    secondary = 8,
    tertiary = 6,
    residential = 6,
  }
  if streetWidths[tags["highway"]] then
    return streetWidths[tags["highway"]]
  end

  return 8
end
