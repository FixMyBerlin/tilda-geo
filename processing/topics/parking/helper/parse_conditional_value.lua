-- Parse OSM conditional tag values in format: value1 @ (condition1); value2 @ (condition2); ...
-- Examples: 'no_stopping @ (Mo-Fr 06:00-09:00)', 'loading_only @ (08:00-18:00)'

local function trim(str)
  return str:match("^%s*(.-)%s*$")
end

local function trim_parentheses(str)
  return str:gsub("^%(", ""):gsub("%)$", "")
end

---@param value string|nil The conditional value string to parse
---@return {value: string, condition: string}[]|nil List of parsed conditional values or nil if none valid
local function parse_conditional_value(value)
  if not value or type(value) ~= 'string' then
    return nil
  end

  local results = {}

  local function separate_conditional_values(str, sep)
    local parts = {}
    local current = {}
    local depth = 0

    for i = 1, #str do
      local ch = str:sub(i, i)
      if ch == '(' then
        depth = depth + 1
        table.insert(current, ch)
      elseif ch == ')' then
        if depth > 0 then
          depth = depth - 1
        end
        table.insert(current, ch)
      elseif ch == sep and depth == 0 then
        local part = trim(table.concat(current))
        if part ~= '' then
          table.insert(parts, part)
        end
        current = {}
      else
        table.insert(current, ch)
      end
    end

    local part = trim(table.concat(current))
    if part ~= '' then
      table.insert(parts, part)
    end

    return parts
  end

  local parts = separate_conditional_values(value, ';')

  for _, part in ipairs(parts) do
    local value_part, condition_part = part:match("^%s*(.-)%s+@%s+%((.-)%)%s*$")

    if not value_part or not condition_part then
      value_part, condition_part = part:match("^%s*(.-)%s+@%s+(.+)%s*$")
    end

    if value_part and condition_part then
      table.insert(results, {
        value = trim(value_part),
        condition = trim_parentheses(trim(condition_part))
      })
    end
  end

  if #results > 0 then
    return results
  end

  return nil
end

return parse_conditional_value
