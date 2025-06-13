require('init')
require('Set')
require('Log')

DISALLOWED_VALUE = 'DISALLOWED_VALUE'

-- Sanitize with fallback DISALLOWED_VALUE.
-- Use together with sanitize_cleanup_and_log()
function sanitize_for_logging(value, allowed, ignored)
  if value == nil then
    return nil
  end

  if Set(allowed or {})[value] then
    return value
  end

  if Set(ignored or {})[value] then
    return nil
  end

  return DISALLOWED_VALUE
end
