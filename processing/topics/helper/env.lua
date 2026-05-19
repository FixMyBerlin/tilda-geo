local log = require('topics.helper.log')
local inspect = require('inspect')

-- Import as 'local ENV = require(\'env\')' and use as ENV.is_production.
-- We use a different pattern here to allow us to overwrite the values easily in tests.
-- Note: This is always nil during test runs because then env is missing then.
local function is_production()
  local env = os.getenv('ENVIRONMENT')
  -- print('ENV is_production: ' .. inspect(env == 'production'))
  return env == 'production'
end

local ENV = { is_production = is_production() }
return ENV
