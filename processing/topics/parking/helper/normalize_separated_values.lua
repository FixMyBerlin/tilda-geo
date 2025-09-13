-- Helper function to split, sort, deduplicate, and merge separator-separated values
---@param value string|nil The separator-separated string to normalize
---@param separator string The separator character (default: ';')
---@return string|nil The normalized string with sorted unique values, or nil if input is nil or empty
local function normalize_separated_values(value, separator)
  separator = separator or ';'

  if not value or value == '' then return nil end

  local parts = {}
  local seen = {}
  for part in value:gmatch('[^' .. separator .. ']+') do
    local trimmed = part:match('^%s*(.-)%s*$') -- trim whitespace
    if trimmed ~= '' and trimmed ~= nil and not seen[trimmed] then
      table.insert(parts, trimmed)
      seen[trimmed] = true
    end
  end

  -- If no valid parts found, return nil
  if #parts == 0 then
    return nil
  end

  table.sort(parts)
  return table.concat(parts, separator)
end

return normalize_separated_values
