local inspect = require('inspect')

function Log(input, prefix)
  prefix = (prefix and prefix .. ": ") or ""
  prefix = prefix .. "<" .. type(input) .. "> "
  print("\nxxx" .. prefix .. inspect(input))
end
