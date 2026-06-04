local width_errors = require('width_errors')

local function parse_width(value, object, tag_name)
  if not value or value == "" then
    return nil
  end

  if type(value) == "number" then
    return value
  end

  -- Clean string: convert commas to dots and trim whitespace
  local clean_value = tostring(value):gsub(",", "."):gsub("^%s*", ""):gsub("%s*$", "")

  local val, unit = osm2pgsql.split_unit(clean_value, 'm')
  if val then
    if unit == 'cm' then
      return val / 100
    elseif unit == 'm' then
      return val
    elseif unit == 'km' then
      return val * 1000
    end
  end

  -- If it couldn't be parsed, log to width_errors if object is provided
  if object then
    width_errors.log(object, tag_name or "width", value, "Could not parse width value")
  end

  return nil
end

return parse_width
