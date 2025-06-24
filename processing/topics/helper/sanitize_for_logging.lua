require('init')
require('Set')
require('Log')
local SANITIZE_VALUES = require('sanitize_values')

-- Sanitize with fallback DISALLOWED_VALUE.
-- Use together with sanitize_cleanup_and_log()
local function sanitize_for_logging(value, allowed, ignored)
  if value == nil then
    return nil
  end

  if Set(allowed or {})[value] then
    return value
  end

  if Set(ignored or {})[value] then
    return nil
  end

  return SANITIZE_VALUES.disallowed
end

return sanitize_for_logging
