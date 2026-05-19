local SET = require('topics.helper.sets')
local log = require('topics.helper.log')
local SANITIZE_VALUES = require('topics.helper.sanitize_values')

-- sanitize with fallback DISALLOWED_VALUE.
-- Use together with sanitize_cleanup_and_log()
local function sanitize_for_logging(value, allowed, ignored)
  if value == nil then
    return nil
  end

  if SET.set(allowed or {})[value] then
    return value
  end

  if SET.set(ignored or {})[value] then
    return nil
  end

  return SANITIZE_VALUES.disallowed
end

return sanitize_for_logging
