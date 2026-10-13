-- Shared highway width fallbacks (metres) when OSM width tags are missing.
-- Used through `derive_width_with_fallback` by parking, the bikelane/routing offset and the routing width.
-- Main roads (primary/secondary/tertiary): different values for oneway vs non-oneway (2/3 rule for dual carriageways).
-- Other roads: same value regardless of oneway.

local DEFAULT_FALLBACK = 10

-- INFERRED (needs review): interpolated from parking primary/secondary ladder (+4 two-way / +3 oneway steps)
local highway_width_fallbacks_no_oneway = {
  ['motorway'] = 22,
  ['trunk'] = 20,
  ['primary'] = 18,
  ['secondary'] = 14,
  ['tertiary'] = 10,
  ['motorway_link'] = 9,
  ['trunk_link'] = 9,
  ['primary_link'] = 6,
  ['secondary_link'] = 6,
  ['tertiary_link'] = 6,
  ['residential'] = 8,
  ['unclassified'] = 8,
  ['living_street'] = 5,
  ['pedestrian'] = 8,
  ['road'] = 8,
  ['service'] = 4,
  ['bus_guideway'] = 3,
  ['track'] = 2.5,
  ['footway'] = 2.5,
  -- INFERRED (needs review): match footway / track tier
  ['path'] = 2.5,
  ['bridleway'] = 2.5,
  -- INFERRED (needs review): below footway (2.5)
  ['cycleway'] = 2,
  ['steps'] = 2,
}

local highway_width_fallbacks_oneway = {
  ['motorway'] = 15,
  ['trunk'] = 15,
  ['primary'] = 12,
  ['secondary'] = 9,
  ['tertiary'] = 7,
  ['motorway_link'] = 9,
  ['trunk_link'] = 9,
  ['primary_link'] = 6,
  ['secondary_link'] = 6,
  ['tertiary_link'] = 6,
  ['residential'] = 8,
  ['unclassified'] = 8,
  ['living_street'] = 5,
  ['pedestrian'] = 8,
  ['road'] = 8,
  ['service'] = 4,
  ['bus_guideway'] = 3,
  ['track'] = 2.5,
  ['footway'] = 2.5,
  -- INFERRED (needs review): match footway / track tier
  ['path'] = 2.5,
  ['bridleway'] = 2.5,
  -- INFERRED (needs review): below footway (2.5)
  ['cycleway'] = 2,
  ['steps'] = 2,
}

---@alias HighwayWidthFallbackSource 'highway_default'|'highway_default_and_oneway'
---@class HighwayWidthFallback
---@field value number
---@field source HighwayWidthFallbackSource

---@param oneway string|nil
---@return boolean
local function is_oneway_highway(oneway)
  return oneway == 'yes' or oneway == 'implicit_yes' or oneway == 'car_not_bike'
end

---@param highway string|nil
---@param is_oneway boolean
---@return HighwayWidthFallback
local function derive_highway_width_fallback(highway, is_oneway)
  local width_oneway = highway and highway_width_fallbacks_oneway[highway]
  local width_no_oneway = highway and highway_width_fallbacks_no_oneway[highway]

  if is_oneway then
    return {
      value = width_oneway or DEFAULT_FALLBACK,
      source = (width_oneway == width_no_oneway) and 'highway_default' or 'highway_default_and_oneway',
    }
  end

  return {
    value = width_no_oneway or DEFAULT_FALLBACK,
    source = 'highway_default',
  }
end

---@class HighwayWidthFallbacks
---@field DEFAULT_FALLBACK number
---@field highway_width_fallbacks_oneway table<string, number>
---@field highway_width_fallbacks_no_oneway table<string, number>
---@field is_oneway_highway fun(oneway: string|nil): boolean
---@field derive_highway_width_fallback fun(highway: string|nil, is_oneway: boolean): HighwayWidthFallback

return {
  DEFAULT_FALLBACK = DEFAULT_FALLBACK,
  highway_width_fallbacks_oneway = highway_width_fallbacks_oneway,
  highway_width_fallbacks_no_oneway = highway_width_fallbacks_no_oneway,
  is_oneway_highway = is_oneway_highway,
  derive_highway_width_fallback = derive_highway_width_fallback,
} ---@type HighwayWidthFallbacks
