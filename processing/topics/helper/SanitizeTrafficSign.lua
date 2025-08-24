require('init')
local sanitize_string = require('sanitize_string')

-- Remove all whitespaces after delimeters
local function stripWhitespaces(traffic_sign)
  local stripped = string.gsub(traffic_sign, ', ', ',')
  stripped = string.gsub(stripped, '; ', ';')
  return stripped
end

local function sanitize_value(value)
  return sanitize_string(stripWhitespaces(value))
end

--- Cleanup the `traffic_sign=*` tag
--- @param traffic_sign string
--- @returns string
function SanitizeTrafficSign(traffic_sign)
  if traffic_sign == nil then
    return nil
  end
  if traffic_sign == "no" or traffic_sign == 'none' then
    return "none"
  end

  -- This is the correct tagging, all traffic signs should start with DE:
  -- DOCS: patterns with "^" target beginning of string
  if string.find(traffic_sign, '^DE:%S') then
    return sanitize_value(traffic_sign)
  end

  local substitutions = {
    ['^DE: '] = 'DE:',
    ['^DE%.'] = 'DE:',
    ['^D:'] = 'DE:',
    ['^D%.'] = 'DE:',
    ['^de:'] = 'DE:',
    ['^DE1'] = 'DE:1',
    ['^DE2'] = 'DE:2',
    ['^2'] = 'DE:2',
    ['^1'] = 'DE:1',
    -- These patterns could handle all the above in a more generalized way
    -- ['^DE?[:.]%s?'] = 'DE:',
    -- ['^de?[:.]%s?'] = 'DE:'
    -- ['^DE(%d)'] = 'DE:%1'
    -- ['^(%d)'] = 'DE:%1'
  }
  for pattern, substitude in pairs(substitutions) do
    local val, n = string.gsub(traffic_sign, pattern, substitude)
    if n > 0 then
      return sanitize_value(val)
    end
  end

  -- Discard everything else
  return nil
end
