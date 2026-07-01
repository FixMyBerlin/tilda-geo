local ftcsv = require('ftcsv')
local inspect = require('inspect')
local pl = require('pl.tablex')
local pl_path = require('pl.path')
local log = require('topics.helper.log')

local MAPILLARY_CSV = '/data/pseudoTagsData/mapillary_coverage.csv'
local SIDEPATH_CSV = '/data/pseudoTagsData/is_sidepath_estimation.csv'

local function ensure_entry(merged, id)
  local entry = merged[id]
  if not entry then
    entry = {}
    merged[id] = entry
  end
  return entry
end

local function csv_is_empty(csv_path)
  if not pl_path.exists(csv_path) then
    return true
  end
  local f = io.open(csv_path, 'r')
  if not f then
    return true
  end
  local size = f:seek('end')
  f:close()
  return not size or size == 0
end

local function parse_csv_rows(csv_path, label)
  if csv_is_empty(csv_path) then
    if pl_path.exists(csv_path) then
      log('ERROR: CSV file is empty: ' .. csv_path, label)
    else
      log('ERROR: CSV file not found: ' .. csv_path, label)
    end
    return {}
  end

  local ok, parsed_or_err = pcall(ftcsv.parse, csv_path)
  if ok then
    return parsed_or_err
  end
  log('ERROR: CSV parse failed: ' .. csv_path .. ' — ' .. tostring(parsed_or_err), label)
  return {}
end

local function merge_mapillary(merged, rows)
  for _, row in ipairs(rows) do
    local id = tonumber(row['osm_id'])
    local value = row['mapillary_coverage']
    if id and value and value ~= '' then
      ensure_entry(merged, id).mapillary_coverage = value
    end
  end
end

local function merge_sidepath(merged, rows)
  for _, row in ipairs(rows) do
    local id = tonumber(row['osm_id'])
    if id then
      local entry = ensure_entry(merged, id)
      local estimation = row['is_sidepath_estimation']
      if estimation ~= nil and estimation ~= '' then
        entry.is_sidepath_estimation = estimation
      else
        entry.is_sidepath_estimation = 'true'
      end

      local adjoining_road = row['adjoining_road']
      if adjoining_road ~= nil and adjoining_road ~= '' then
        entry.adjoining_road = adjoining_road
      end

      local adjoining_maxspeed = row['adjoining_maxspeed']
      if adjoining_maxspeed ~= nil and adjoining_maxspeed ~= '' then
        entry.adjoining_maxspeed = adjoining_maxspeed
      end
    end
  end
end

local function load_merged_pseudo_tags()
  local cached = nil

  return {
    get = function()
      if cached then
        return cached
      end

      local log_start = os.time()
      cached = {}

      merge_mapillary(cached, parse_csv_rows(MAPILLARY_CSV, 'load_merged_pseudo_tags.mapillary'))
      merge_sidepath(cached, parse_csv_rows(SIDEPATH_CSV, 'load_merged_pseudo_tags.sidepath'))

      local sample_id, sample_row = next(cached)
      local sample = {}
      if sample_id then
        sample[sample_id] = sample_row
      end

      print(
        'MERGE: Lookup cache built ('
          .. os.difftime(os.time(), log_start)
          .. 's, '
          .. pl.size(cached)
          .. ' rows) — Example: '
          .. inspect(sample, { newline = '', indent = '' })
      )

      return cached
    end,
  }
end

return load_merged_pseudo_tags
