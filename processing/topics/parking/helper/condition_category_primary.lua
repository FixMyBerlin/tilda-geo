-- Rendering-only: pick the primary base of `condition_category` for styling.
--
-- KEEP IN SYNC with the token order in
-- `park_street_default.ts` and `park_off_default_area.ts`
-- (generated from Mapbox Studio via `scripts/MapboxStyles/process.ts`)
-- and with `tilda_condition_category_priority()` in
-- `custom_functions/condition_category_priority.sql` (edge-side tie-break, SQL copy).
-- Edge colours: `parkingTildaEdgesLayers.const.ts` (`conditionCategoryPrimaryLineColor`).
--
-- `classify_parking_conditions` can emit extra bases (e.g. `no_standing`); those are
-- not in this list and fall through to `'default'`.
-- `invalid` (malformed OSM conditional tags) has no own colour in the styles; it uses the style fallback on purpose.
-- First list match wins; nil/empty/no match → 'default'.

local PRIORITY = {
  'no_stopping',
  'bus_lane',
  'no_parking',
  'disabled_private',
  'disabled',
  'loading',
  'charging',
  'taxi',
  'car_sharing',
  'private',
  'assumed_private',
  'vehicle_restriction',
  'access_restriction',
  'maxweight',
  'mixed',
  'residents',
  'paid',
  'time_limited',
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
