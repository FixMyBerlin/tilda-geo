-- Debug-only Lua heap sampling — not wired into prod topics.
--
-- 1. Paste the usage block at the bottom into the topic you are investigating.
-- 2. Set PT_MEMORY_REPORT=1 in repo root `.env` for that run (loaded via docker-compose env_file).
--    Optional: PT_MEMORY_REPORT_EVERY=N (default 100000).
--
-- Reports `collectgarbage('count')` (Lua heap only — not osm2pgsql C++ memory) as MEMORY: lines.
-- When and how: `.cursor/skills/test-processing-diff/SKILL.md` § Lua heap profiling.

local ENABLED = os.getenv('PT_MEMORY_REPORT') == '1'
local REPORT_EVERY = tonumber(os.getenv('PT_MEMORY_REPORT_EVERY')) or 100000

--- Current Lua heap size in whole MiB (rounded up).
local function mbytes()
  return math.ceil(collectgarbage('count') / 1024)
end

--- Print a single labelled heap snapshot. No-op unless PT_MEMORY_REPORT=1.
---@param label string
local function log_snapshot(label)
  if not ENABLED then
    return
  end
  print(string.format('MEMORY: %s %d MiB', label, mbytes()))
end

--- Return a counter fn; call it once per object to log heap every PT_MEMORY_REPORT_EVERY calls.
--- Returns a no-op fn unless PT_MEMORY_REPORT=1.
---@param label string
---@return fun()
local function create_way_reporter(label)
  if not ENABLED then
    return function() end
  end

  local counter = 0
  return function()
    counter = counter + 1
    if counter % REPORT_EVERY == 0 then
      print(string.format('MEMORY: %s ways=%d heap=%d MiB', label, counter, mbytes()))
    end
  end
end

return {
  enabled = ENABLED,
  mbytes = mbytes,
  log_snapshot = log_snapshot,
  create_way_reporter = create_way_reporter,
}

-- Example (paste into a topic while debugging, e.g. prepare_pseudo_tags_roads_bikelanes.lua):
--
--   local memory_reporter = require('topics.helper.memory_reporter')
--   local report_way_memory = memory_reporter.create_way_reporter('roads_bikelanes.pseudo_tags')
--   -- call report_way_memory() once per way inside process_way / prepare
--
--   memory_reporter.log_snapshot('before merged pseudo-tag CSV load')
--   -- ... CSV load ...
--   memory_reporter.log_snapshot('after merged pseudo-tag CSV load')
