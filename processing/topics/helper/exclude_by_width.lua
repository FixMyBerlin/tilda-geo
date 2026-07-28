-- * @desc If and why a highway object should be excluded based on its width.
-- * @returns { boolean (shouldFilter), string (reason) }
function exclude_by_width(tags, min_width)
  local width = tonumber(tags.width)
  if width and width < min_width then
    return true, ';Excluded since `width<' .. min_width .. '` indicates a special interest path'
  end
  return false, ''
end
