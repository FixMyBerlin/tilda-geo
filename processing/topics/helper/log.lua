local inspect = require('inspect')

local function log(input, prefix)
  prefix = (prefix and prefix .. ': ') or ''
  prefix = prefix .. '<' .. type(input) .. '> '
  print('\nxxx' .. prefix .. inspect(input))
end

return log
