local parse_length = require('topics.helper.parse_length')

-- * @desc If and why a highway object should be excluded based on its width.
-- * @param tags OsmTags
-- * @param min_width number
-- * @returns { boolean (shouldFilter), string (reason) }
function exclude_by_width(tags, min_width)
  local width = parse_length(tags.width)
  if width and width < min_width then
    return true, ';Excluded since `width<' .. min_width .. '` indicates a special interest path'
  end
  return false, ''
end
