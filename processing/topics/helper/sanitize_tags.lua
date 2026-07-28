-- Provides a collection of named sanitizer functions that clean and normalise OSM tag values
-- before they are written to the database. Each sanitizer enforces a strict, predictable value
-- range. Unknown values are returned as 'DISALLOWED_VALUE' so they surface in monitoring without
-- being persisted. Values that are known but intentionally irrelevant are silently dropped (nil).

local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')
local sanitize_for_logging = require('topics.helper.sanitize_for_logging')
local parse_length = require('topics.helper.parse_length')
local sanitize_string = require('topics.helper.sanitize_string')

--- Value fed into `operator_type` before transformation / allowlist (for `separate_tags` logging).
---@param tags OsmTags|nil
---@return string|nil
local function operator_type_input(tags)
  if not tags then return nil end
  local value = tags['operator:type']
  if value == nil then
    if tags.operator == 'private' then return 'private' end
    if tags.operator == 'public' then return 'public' end
    return nil
  end
  return value
end

---@class SanitizeTags
---@field safe_string fun(value: string|nil): string|nil
---@field road_name fun(tags: OsmTags): string|nil
---@field oneway_road fun(tags: OsmTags): string|nil
---@field oneway_bicycle fun(value: string|nil): string|nil
---@field boolean_yes fun(value: string|nil): string|nil
---@field access fun(value: string|nil): string|nil
---@field traffic_sign fun(value: string|nil): string|nil
---@field surface fun(tags: OsmTags): string|nil
---@field operator_type_log_source fun(tags: OsmTags|nil): string|nil
---@field operator_type fun(tags: OsmTags): string|nil
---@field indoor fun(value: string|nil): string|nil
---@field informal fun(value: string|nil): string|nil
---@field covered fun(value: string|nil): string|nil
---@field covered_or_indoor fun(tags: OsmTags): string|nil
---@type SanitizeTags
local SANITIZE_TAGS = {
  safe_string = function (value)
    return sanitize_string(value)
  end,
  road_name = function (tags)
    local name = tags.name or tags.ref or tags['is_sidepath:of:name'] or tags['street:name']
    return sanitize_string(name)
  end,
  oneway_road = function (tags)
    if tags.oneway == 'yes' and tags.dual_carriageway == 'yes' then
      return 'yes_dual_carriageway'
    end
    return sanitize_for_logging(tags.oneway, { 'yes' }, { 'no' })
  end,
  oneway_bicycle = function (value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,
  boolean_yes = function (value)
    return sanitize_for_logging(value, { 'yes' }, { 'no' })
  end,
  access = function (value)
    if value == 'yes' then
      return 'public'
    end
    if value == 'construction' then
      return 'private'
    end
    return sanitize_for_logging(value, { 'no', 'private', 'permissive', 'permit', 'employees', 'customers', 'delivery', 'destination', 'residents', 'public' })
  end,
  traffic_sign = function (value)
    return sanitize_traffic_sign(value)
  end,
  surface = function (tags)
    if tags.surface == nil then return nil end
    -- Transform known but unsupported values to values that we support:
    local transformations = {
      -- Ground
      earth = 'ground', mud = 'ground', clay = 'ground', dirt = 'ground',
      ['dirt/sand'] = 'ground',
      -- Sett
      cobblestone = 'large_sett',
      unhewn_cobblestone = 'large_sett',
      ['cobblestone:flattened'] = 'large_sett',
      -- Stone
      rock = 'stone', ['stone:plates'] = 'stone',
      -- Paving Stones
      ['paving_stones:20'] = 'paving_stones', -- we don't transform the tags['paving_stones:length'] = 20 for now because we don't use it
      ['paving_stones:30'] = 'paving_stones', -- we don't transform the tags (yet)
      -- Other
      tartan = 'rubber',
    }
    if transformations[tags.surface] then
      return transformations[tags.surface]
    end
    -- Treat special cases:
    -- https://wiki.openstreetmap.org/wiki/Tag:surface%3Dsett#Size
    if tags.surface == 'sett' then
      local size = parse_length(tags['sett:length'])
      if size and size <= 0.08 then return 'mosaic_sett' end
      if size and size <= 0.13 then return 'small_sett' end
      if size and size > 0.13 then return 'large_sett' end
    end
    -- sanitize values:
    return sanitize_for_logging(tags.surface, {
        -- Common
        'asphalt',
        -- Unspecific
        'paved', 'unpaved',
        -- Concrete
        'concrete', 'concrete:plates', 'concrete:lanes',
        -- Stone/brick types
        'paving_stones', 'paving_stones:lanes', 'sett', 'bricks', 'stone',
        -- Ground/earthy
        'ground', 'grass', 'sand', 'compacted', 'fine_gravel', 'gravel', 'pebblestone',
        -- Material
        'wood', 'woodchips', 'metal', 'metal_grid', 'plastic', 'rubber', 'grass_paver',
      },
      -- Values that we ignore (not part of the logging, just silently `nil`ed)
      { 'ice', 'snow', 'salt', }
    )
  end,
  -- Keep a dedicated API key for `separate_tags` source mapping while reusing
  -- the exact same input extraction logic as `operator_type`.
  operator_type_log_source = operator_type_input,
  operator_type = function(tags)
    local value = operator_type_input(tags)
    if value == nil then return nil end

    -- DOCs: to revalidate this query, use…
    -- curl -g https://postpass.geofabrik.de/api/0.2/interpreter --data-urlencode 'options[geojson]=false' --data-urlencode 'data=
    --   SELECT line.tags->>'operator:type' AS operator_type, COUNT(*) AS way_count
    --   FROM postpass_line AS line WHERE line.tags ? 'highway' GROUP BY line.tags->>'operator:type' ORDER BY way_count DESC'
    -- Transform known but unsupported values to values that we support:
    local transformations = {
      ['government'] = 'public',
      ['council'] = 'public',
      ['university'] = 'public',
      ['business'] = 'private',
      ['privat'] = 'private',
      ['private_non_profit'] = 'private',
      ['military'] = 'private',
    }
    if transformations[value] then
      return transformations[value]
    end

    return sanitize_for_logging(value, { 'public', 'private' })
  end,
  indoor = function(value)
    return sanitize_for_logging(value, { 'yes' }, { 'no' })
  end,
  informal = function(value)
    return sanitize_for_logging(value, { 'yes' }, { 'no', 'unknown' })
  end,
  covered = function(value)
    return sanitize_for_logging(value, { 'yes', 'partial' }, { 'no' })
  end,
  covered_or_indoor = function(tags)
    if tags.covered == 'yes' then
      return 'covered'
    elseif tags.covered == 'partial' then
      return 'partial'
      -- Note: indoor=partial used <10 times
    elseif tags.indoor == 'yes' then
      return 'indoor'
    else
      return nil
    end
  end,
}

return SANITIZE_TAGS
