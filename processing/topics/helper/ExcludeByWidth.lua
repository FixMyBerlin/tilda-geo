local parse_width = require('parse_width')

-- * @desc If and why a highway object should be excluded based on its width.
-- * @returns { boolean (shouldFilter), string (reason) }
function ExcludeByWidth(tags, minWidth, object)
  if not tags.width then
    return false, ""
  end

  local width = parse_width(tags.width, object, 'width')
  if width and width < minWidth then
    return true, ";Excluded since `width<" .. minWidth .. "` indicates a special interest path"
  end
  return false, ""
end
