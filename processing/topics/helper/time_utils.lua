---@param timestamp? integer
---@return integer?
-- Given a unix timestamp in unix return the age in days that have passed since (>730 is outdated)
function age_in_days(timestamp)
  -- Return nil for all that is not a number
  if type(timestamp) ~= 'number' or tonumber(timestamp) == nil then
    return nil
  end

  local diff = os.time() - timestamp
  return math.floor(diff / (3600 * 24))
end

-- TODO: allow parsing of YYYY-MM => asume day=1
---@param date? string
---@return integer?
-- given a date in YYYY-MM-DD return the respective unix timestamp
function parse_check_date(date)
  if date == nil then
    return nil
  end
  local format = '(%d%d%d%d)-(%d%d)-(%d%d)'
  local year, month, day = date:match(format)

  if (year == nil or month == nil or day == nil) then
    return nil
  end

  return os.time({ year = year, month = month, day = day })
end
