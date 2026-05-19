local log = require('topics.helper.log')

-- List and return all available environment variables.
-- Thanks to https://stackoverflow.com/a/29716746
function list_env()
  local osEnv = {}
  for line in io.popen('set'):lines() do
    local envName = line:match('^[^=]+')
    osEnv[envName] = os.getenv(envName)
  end
  log(osEnv)
  return osEnv
end
