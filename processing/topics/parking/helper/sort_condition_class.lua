-- This function sorts condition classes by time. Classes without time conditions are kept at first.
-- Examples:
-- { 'mixed (Mo-Fr 18:00-20:00)'; 'no_parking (08:00-14:00)'; 'no_stopping (06:00-08:00,14:00-18:00)' }
-- => { 'no_stopping (06:00-08:00,14:00-18:00)'; 'no_parking (08:00-14:00)'; 'mixed (Mo-Fr 18:00-20:00)' }
-- { 'time_limited (08:00-18:00)'; 'charging' }
-- => { 'charging'; 'time_limited (08:00-18:00)' }

---@param s string|nil
---@return boolean has_paren
---@return number|nil time
local function parse_entry(s)
  if not s or type(s) ~= 'string' then
    return false, nil
  end

  local has_paren = s:find("%(") ~= nil
  local h, m = s:match("(%d%d):(%d%d)")
  local time
  if h and m then
    time = tonumber(h) * 60 + tonumber(m)
  end
  return has_paren, time
end

---@param list string[]|nil The list containing parking conditions
---@return string[]|nil The list with the same entries sorted by time
local function sort_condition_class(list)
  if not list or #list == 0 then
    return list
  end

  table.sort(list, function(a, b)
    local a_paren, a_time = parse_entry(a)
    local b_paren, b_time = parse_entry(b)
    -- 1. Classes without conditions (= without paranthesis)
    if a_paren ~= b_paren then
      return not a_paren
    end
    -- 2. Sort others by time
    if a_time and b_time then
      return a_time < b_time
    end
    -- 3. Classes with conditions, but without time
    if a_time ~= b_time then
      return a_time ~= nil
    end
    return false
  end)

  return list
end

return sort_condition_class
