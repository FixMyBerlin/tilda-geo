-- Strict syntax check for OSM conditional values: `value @ (condition); value @ condition; ...`
-- We reject what we can not interpret reliably instead of passing broken fragments through to `condition_category`.
-- Invalid examples from OSM:
--   'no_stopping @ (Mo-Sa 07:00-19:00; PH off)...)' — stray closing bracket
--   'no_parking @ (Mo-Fr 09:00-20:00; Sa 09:00-18:00; none @ residents' — missing closing bracket
--   'designated @ (@ (Mo-Fr 07:00-19:00)' — nested brackets and `@` inside the condition

local function trim(str)
  return str:match('^%s*(.-)%s*$')
end

-- Split at `;` outside of brackets; returns nil when brackets are unbalanced or nested.
---@param value string
---@return string[]|nil
local function split_parts(value)
  local parts = {}
  local current = {}
  local depth = 0

  for i = 1, #value do
    local ch = value:sub(i, i)
    if ch == '(' then
      depth = depth + 1
      if depth > 1 then return nil end
    elseif ch == ')' then
      depth = depth - 1
      if depth < 0 then return nil end
    end
    if ch == ';' and depth == 0 then
      table.insert(parts, table.concat(current))
      current = {}
    else
      table.insert(current, ch)
    end
  end
  if depth ~= 0 then return nil end

  table.insert(parts, table.concat(current))
  return parts
end

---@param part string
---@return boolean
local function is_valid_part(part)
  local value, condition = part:match('^(.-)%s+@%s+%((.*)%)$')
  if not value then
    value, condition = part:match('^(.-)%s+@%s+(.+)$')
  end
  if not value or not condition then return false end

  value = trim(value)
  condition = trim(condition)
  if value == '' or condition == '' then return false end
  if value:find('[@()]') or condition:find('[@()]') then return false end
  return true
end

---@param value string|nil
---@return boolean
local function is_valid_conditional_value(value)
  if not value or type(value) ~= 'string' or trim(value) == '' then
    return false
  end

  local parts = split_parts(value)
  if not parts then return false end

  -- Empty parts (e.g. a trailing `;`) are harmless; `parse_conditional_value` skips them too.
  local has_part = false
  for _, part in ipairs(parts) do
    local trimmed = trim(part)
    if trimmed ~= '' then
      if not is_valid_part(trimmed) then return false end
      has_part = true
    end
  end
  return has_part
end

return is_valid_conditional_value
