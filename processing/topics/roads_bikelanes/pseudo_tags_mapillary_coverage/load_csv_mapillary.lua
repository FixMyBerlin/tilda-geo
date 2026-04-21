require('init')
local ftcsv = require('ftcsv')
local pl_path = require('pl.path')
require('Log')
local inspect = require('inspect')
local pl = require('pl.tablex')

-- Generic CSV loader that returns the full parsed table, cached
local function load_csv_mapillary(csv_path)
  local cached_lines = nil

  return {
    get = function(self)
      local log_start = os.time()
      local log_lines = nil

      if cached_lines then return cached_lines end

      if not pl_path.exists(csv_path) then
        Log('ERROR: CSV file not found: ' .. csv_path, 'load_csv_mapillary')
        cached_lines = {}
        return cached_lines
      end

      local f = io.open(csv_path, 'r')
      if f then
        local size = f:seek('end')
        f:close()
        if not size or size == 0 then
          Log('ERROR: CSV file is empty: ' .. csv_path, 'load_csv_mapillary')
          cached_lines = {}
          return cached_lines
        end
      end

      rows = ftcsv.parse(csv_path)
      cached_lines = cached_lines or {}
      for _, row in ipairs(rows) do
        local id = tonumber(row['osm_id'])
        if id then
          cached_lines[id] = row
          cached_lines[id]['osm_id'] = nil
          if log_lines == nil then
            log_lines = {}
            log_lines[id] = cached_lines[id]
          end
        end
      end

      print('CSV: File cached (' .. os.difftime(os.time(), log_start) .. 's, ' .. pl.size(cached_lines) .. ' rows) ' .. csv_path .. ' — Example: ' .. inspect(log_lines, { newline = '', indent = '' }))
      return cached_lines
    end,
  }
end

return load_csv_mapillary
