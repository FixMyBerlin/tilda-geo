-- Rendering-only: pick the primary base of `condition_category` for styling.
--
-- This list is the source of truth for the order (agreed in FixMyBerlin/private-issues#3193):
-- special-use spaces first (they are the relevant info even inside a no-stopping / bus lane window),
-- then prohibitions, then private/access limits, then `time_limited` before the zone-wide
-- `mixed`/`residents`/`paid` so it stays visible inside a managed zone.
-- KEEP IN SYNC with `tilda_condition_category_priority()` in
-- `custom_functions/condition_category_priority.sql` (edge-side tie-break, SQL copy).
-- The map styles (`park_street_default.ts`, `park_off_default_area.ts`,
-- `parkingTildaEdgesLayers.const.ts`) match the value with `==`; their order does not matter,
-- but every value here needs a colour there.
--
-- `classify_parking_conditions` can emit extra bases (e.g. `no_standing`); those are
-- not in this list and fall through to `'default'`.
-- `invalid` (malformed OSM conditional tags) has no own colour in the styles; it uses the style fallback on purpose.
-- First list match wins; nil/empty/no match → 'default'.

local PRIORITY = {
  'disabled',
  'disabled_private',
  'taxi',
  'loading',
  'charging',
  'car_sharing',
  'no_parking',
  'no_stopping',
  'bus_lane',
  'private',
  'assumed_private',
  'vehicle_restriction',
  'access_restriction',
  'maxweight',
  'time_limited',
  'mixed',
  'residents',
  'paid',
  'unspecified',
  'free',
  'assumed_free',
  'invalid',
}

---@param condition_category string|nil `;`-separated segments, each `base` or `base (detail)`
---@return string
local function condition_category_primary(condition_category)
  if condition_category == nil then
    return 'default'
  end

  ---@type table<string, boolean>
  local bases = {}
  for segment in string.gmatch(condition_category, '[^;]+') do
    local base = segment:match('^%s*(.-)%s*$'):gsub(' %(.*$', ''):match('^%s*(.-)%s*$')
    if base ~= '' then
      bases[base] = true
    end
  end

  for _, category in ipairs(PRIORITY) do
    if bases[category] then
      return category
    end
  end
  return 'default'
end

return condition_category_primary
