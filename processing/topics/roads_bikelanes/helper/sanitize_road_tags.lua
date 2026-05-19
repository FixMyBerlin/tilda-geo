local sanitize_for_logging = require('topics.helper.sanitize_for_logging')
local parse_length = require('topics.helper.parse_length')

local SEPARATION_ALLOWED = {
  'no',
  'bollard',
  'flex_post',
  'vertical_panel',
  'studs',
  'bump',
  'planter',
  'kerb',
  'fence',
  'jersey_barrier',
  'guard_rail',
  'structure',
  'ditch',
  'greenery',
  'hedge',
  'tree_row',
  'cone',
  'kerb;parking_lane',
  'kerb;bollard',
  'yes',
}

local MARKING_ALLOWED = {
  'solid_line',
  'dashed_line',
  'double_solid_line',
  'barred_area',
  'pictogram',
  'surface',
}

local TRAFFIC_MODE_ALLOWED = {
  'no',
  'motor_vehicle',
  'parking',
  'psv',
  'bicycle',
  'foot',
}

local SURFACE_COLOR_ALLOWED = {
  'red',
  'green',
  'red;green',
  'no',
}

--- Original `surface:colour` / `surface:color` before normalization (for error logging).
---@param tags OsmTags
---@return string|nil
local function surface_color_raw(tags)
  return tags['surface:colour'] or tags['surface:color']
end

--- Raw separation value for `side` before normalization.
---@param tags OsmTags
---@param side SideKey
---@return string|nil
local function separation_raw(tags, side)
  local value = tags['separation:' .. side] or tags['separation:both']
  if side == 'left' then
    value = value or tags['separation']
  end
  return value
end

--- Raw marking value for `side` before normalization.
---@param tags OsmTags
---@param side SideKey
---@return string|nil
local function marking_raw(tags, side)
  local value = tags['marking:' .. side] or tags['marking:both']
  if side == 'left' then
    value = value or tags['marking']
  end
  return value
end

--- Raw traffic_mode value for `side` before normalization.
---@param tags OsmTags
---@param side SideKey
---@return string|nil
local function traffic_mode_raw(tags, side)
  local value = tags['traffic_mode:' .. side] or tags['traffic_mode:both']
  if side == 'left' then
    value = value or tags['traffic_mode']
  end
  return value
end

--- Map `separate_tags` result keys to OSM strings for `SANITIZED_VALUE` logging when value is disallowed.
---@param tags OsmTags tag bag passed into the road/bikelane sanitizers (e.g. transformed_tags for bikelanes)
---@return OsmTags
local function log_source_overrides(tags)
  return {
    surface_color = surface_color_raw(tags),
    separation_left = separation_raw(tags, 'left'),
    separation_right = separation_raw(tags, 'right'),
    marking_left = marking_raw(tags, 'left'),
    marking_right = marking_raw(tags, 'right'),
    traffic_mode_left = traffic_mode_raw(tags, 'left'),
    traffic_mode_right = traffic_mode_raw(tags, 'right'),
  }
end

---@class SanitizeRoadTags
---@field log_source_overrides fun(tags: OsmTags): OsmTags
---@field surface_color fun(tags: OsmTags): string|nil
---@field separation fun(tags: OsmTags, side: SideKey): string|nil
---@field marking fun(tags: OsmTags, side: SideKey): string|nil
---@field traffic_mode fun(tags: OsmTags, side: SideKey): string|nil
---@field buffer fun(tags: OsmTags, side: SideKey): number|nil
---@field temporary fun(tags: OsmTags): string|nil
---@type SanitizeRoadTags
local SANITIZE_ROAD_TAGS = {
  log_source_overrides = log_source_overrides,

  surface_color = function(tags)
    local surface_color_value = surface_color_raw(tags)
    if surface_color_value == nil then
      return nil
    end

    local transformations = {
      ['none'] = 'no',
      ['grey'] = 'no',
      ['gray'] = 'no',
      ['#888888'] = 'no',
      ['silver'] = 'no',
      ['dimgray'] = 'no',
      ['#b5565a'] = 'red',
      ['orange'] = 'red',
      ['green;red'] = 'red;green',
    }
    if transformations[surface_color_value] then
      surface_color_value = transformations[surface_color_value]
    end

    return sanitize_for_logging(surface_color_value, SURFACE_COLOR_ALLOWED)
  end,

  separation = function(tags, side)
    local value = tags['separation:' .. side] or tags['separation:both']
    if side == 'left' then
      value = value or tags['separation']
    end
    if value == nil then
      return nil
    end

    local transformations = {
      ['separation_kerb'] = 'bump',
      ['lane_separator'] = 'bump',
      ['surface'] = 'no',
      ['tree_row;kerb'] = 'tree_row',
      ['kerb;tree_row'] = 'tree_row',
      ['tree_row;kerb;parking_lane'] = 'tree_row',
      ['grass_verge;tree_row'] = 'tree_row',
      ['kerb;greenery'] = 'kerb',
      ['parking_lane;kerb'] = 'parking_lane',
      ['solid_line;parking_lane'] = 'parking_lane',
    }
    if transformations[value] then
      value = transformations[value]
    end

    return sanitize_for_logging(value, SEPARATION_ALLOWED)
  end,

  marking = function(tags, side)
    local value = tags['marking:' .. side] or tags['marking:both']
    if side == 'left' then
      value = value or tags['marking']
    end
    if value == nil then
      return nil
    end

    return sanitize_for_logging(value, MARKING_ALLOWED)
  end,

  traffic_mode = function(tags, side)
    local value = tags['traffic_mode:' .. side] or tags['traffic_mode:both']
    if side == 'left' then
      value = value or tags['traffic_mode']
    end
    if value == nil then
      return nil
    end

    local transformations = {
      ['foot;bicycle'] = 'foot',
      ['motorized'] = 'motor_vehicle',
      ['none'] = 'no',
    }
    if transformations[value] then
      value = transformations[value]
    end

    return sanitize_for_logging(value, TRAFFIC_MODE_ALLOWED)
  end,

  buffer = function(tags, side)
    local value = tags['buffer:' .. side] or tags['buffer:both']
    if side == 'left' then
      value = value or tags['buffer']
    end
    if value == nil then
      return nil
    end

    local transformations = {
      ['no'] = 0,
      ['none'] = 0,
    }
    if transformations[value] then
      value = transformations[value]
    end

    return parse_length(value)
  end,

  temporary = function(tags)
    if tags.temporary == 'yes' then
      return 'temporary'
    end
  end,
}

return SANITIZE_ROAD_TAGS
