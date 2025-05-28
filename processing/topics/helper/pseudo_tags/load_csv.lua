require('init')
local ftcsv = require('ftcsv')
local pl_path = require('pl.path')
require('Log')

-- Generic CSV loader that returns the full parsed table, cached
local function load_csv(csv_path)
  local cache = nil

  return {
    get = function(self)
      local start = os.time()
      if cache then return cache end
      if not pl_path.exists(csv_path) then
        Log('ERROR: CSV file not found: ' .. csv_path, 'csv_lookup')
        cache = {}
        return cache
      end
      cache = ftcsv.parse(csv_path)
      print('CSV: File cached (' .. os.difftime(os.time(), start) .. 's, '..#cache..' rows) '..csv_path)
      return cache
    end,
  }
end

return load_csv
