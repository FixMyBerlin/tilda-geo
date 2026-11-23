-- Pure classification for the `_sealing_surfaces` table: tags in, sealing group (+ widths) out.
-- No osm2pgsql calls except `parse_width` -> `osm2pgsql.split_unit`, so it is testable with busted.
--
-- This is about SURFACE SEALING, not land use. The type defaults (`leisure=park` -> D, ...) only
-- approximate sealing and apply when the object has no usable `surface` tag.
--
-- Groups:
--   A    sealed (asphalt, concrete, paving stones, sett, ...)
--   A2   grass pavers (partly sealed)
--   B    sealed by type, surface unknown (pedestrian zones, squares, ground-level car parks incl.
--        street-side parking, footways)
--   D    unsealed (gravel, ground, grass, parks, scrub, ...)
--   tree tree crowns (points: `crown_m`) and tree rows (lines: `width_m`)
--
-- Precedence: a known `surface` tag always decides the group (`surface_explicit = true`), over the
-- type defaults. An unknown or multi-value (`a;b`) surface counts as no surface.
--
-- Surface values come from `derive_surface` (shared sanitizer), so we classify its vocabulary:
-- `cobblestone` / `unhewn_cobblestone` / `cobblestone:flattened` arrive as `large_sett`, `sett` with
-- `sett:length` as `mosaic_sett` / `small_sett` / `large_sett`, and `earth` / `mud` / `dirt` / `clay`
-- as `ground`. Values the sanitizer allows but this table does not list (`bricks`, `stone`, `wood`,
-- `metal`, `paving_stones:lanes`, ...) are stored in `surface` but do not decide the group.
local derive_surface = require('topics.helper.derive_surface')
local road_width_tags = require('topics.parking.roads.helper.road_width_tags')
local parse_width = require('topics.helper.parse_width')
local SET = require('topics.helper.sets')

local classify_sealing = {}

local SURFACE_GROUP = {}
for _, surface in ipairs({
  'asphalt', 'concrete', 'concrete:plates', 'concrete:lanes', 'paving_stones', 'paved',
  'sett', 'mosaic_sett', 'small_sett', 'large_sett', -- incl. cobblestone, unhewn_cobblestone
  'paving_stones:lanes', 'bricks', 'stone', -- stone incl. stone:plates (and rock, via the sanitizer)
}) do
  SURFACE_GROUP[surface] = 'A'
end
SURFACE_GROUP['grass_paver'] = 'A2'
for _, surface in ipairs({
  'gravel', 'fine_gravel', 'compacted', 'sand', 'ground', -- ground incl. dirt, earth, mud
  'grass', 'unpaved', 'pebblestone', 'woodchips',
}) do
  SURFACE_GROUP[surface] = 'D'
end

-- Line widths [m] when the `width` tag is missing or unusable. Sources:
--   footway (incl. footway=sidewalk)  2.5  RASt 06 / EFA (Empfehlungen für Fußgängerverkehrsanlagen)
--   cycleway                          2.0  ERA (Empfehlungen für Radverkehrsanlagen), one-way cycle track
--   path                              2.0  ERA, shared path
--   pedestrian 8.0, living_street 5.0     same as the carriageway defaults of the parking topic
--                                          (parking/roads/helper/road_width_tags.lua)
-- Checked 11/2026 against tagged `width` (median): footway=sidewalk München 2.8, Berlin 2.3,
-- Wetterau 1.7; cycleway 1.8 / 1.7 / 2.1; path 2.8 / 2.5 / 1.5 (path only counts with a sealed
-- surface anyway).
local DEFAULT_LINE_WIDTH = {
  footway = 2.5,
  cycleway = 2.0,
  path = 2.0,
  pedestrian = 8.0,
  living_street = 5.0,
}
local TREE_ROW_WIDTH = 6.0
local DEFAULT_CROWN = 8.0

-- Sane ranges [m] for tagged values. Outside the range the tag is a typo: use the default.
local WIDTH_MIN, WIDTH_MAX = 0.5, 30
local CROWN_MIN, CROWN_MAX = 1, 40

local AREA_HIGHWAY_OK = SET.set({ 'footway', 'pedestrian', 'cycleway' })
-- `area=yes` only counts as an area-type object next to these highways (not on carriageways).
local AREA_YES_HIGHWAY_OK = SET.set({ 'footway', 'pedestrian', 'cycleway', 'path', 'living_street' })
local UNGROUNDED_PARKING = SET.set({ 'underground', 'multi-storey', 'rooftop' })

local DEFAULT_D_NATURAL = SET.set({
  'sand', 'bare_rock', 'scree', 'beach', 'scrub', 'grassland', 'wood', 'heath', 'wetland',
})
local DEFAULT_D_LANDUSE = SET.set({
  'construction', 'brownfield', 'quarry', 'landfill', 'grass', 'meadow', 'flowerbed', 'village_green',
  -- Mostly graves, lawn and gravel / garden plots. Paths with a sealed `surface` still count.
  -- Not `recreation_ground`: it can be a paved fairground (Theresienwiese).
  'cemetery', 'allotments',
  'forest', 'farmland', 'orchard', 'vineyard',
})
local DEFAULT_D_LEISURE = SET.set({ 'park', 'garden' })

-- Highways that describe a paved area when mapped as one (`area=yes`, or a multipolygon).
local AREA_HIGHWAY_TYPE_B = SET.set({ 'pedestrian', 'footway', 'cycleway' })

---@param tags OsmTags
---@param is_relation boolean|nil multipolygon relations are areas without `area=yes`
---@return 'B'|'D'|nil
local function polygon_type_default(tags, is_relation)
  if AREA_HIGHWAY_TYPE_B[tags.highway] and (tags.area == 'yes' or is_relation) then return 'B' end
  if tags.place == 'square' then return 'B' end
  if AREA_HIGHWAY_OK[tags['area:highway']] then return 'B' end
  -- Every car park at ground level: `surface`, `street_side`, `lane`, … and untagged ones.
  if tags.amenity == 'parking' and not UNGROUNDED_PARKING[tags.parking] then return 'B' end
  if DEFAULT_D_NATURAL[tags.natural] then return 'D' end
  if DEFAULT_D_LANDUSE[tags.landuse] then return 'D' end
  if DEFAULT_D_LEISURE[tags.leisure] then return 'D' end
  return nil
end

-- Area-type objects that count with an explicit surface even without a type default.
-- Buildings, roads and barriers are never area-type objects here.
---@param tags OsmTags
---@return boolean
local function is_area_type_object(tags)
  if tags['area:highway'] ~= nil then return true end
  if tags.amenity == 'parking' then return true end
  if tags.place == 'square' then return true end
  if tags.landuse ~= nil or tags.leisure ~= nil then return true end
  if tags.area == 'yes' and tags.barrier == nil then
    return tags.highway == nil or AREA_YES_HIGHWAY_OK[tags.highway] == true
  end
  return false
end

--- Does a CLOSED way describe an area (polygon) rather than a closed line (footway loop, ...)?
--- `area=yes|no` decides. Otherwise highways stay lines, and the area-type keys make an area.
---@param tags OsmTags
---@return boolean
function classify_sealing.is_area_way(tags)
  if tags.area == 'no' then return false end
  if tags.area == 'yes' then return true end
  if tags.highway ~= nil then return false end
  return polygon_type_default(tags) ~= nil or is_area_type_object(tags)
end

---@param tags OsmTags
---@return string|nil surface sanitized value (nil when missing or disallowed)
---@return 'A'|'A2'|'D'|nil group only for the surfaces we classify
local function surface_and_group(tags)
  local surface = derive_surface(tags).surface
  return surface, SURFACE_GROUP[surface]
end

---@class SealingClassification
---@field sealing_group 'A'|'A2'|'B'|'D'|'tree'
---@field surface_explicit boolean
---@field surface string|nil
---@field width_m number|nil
---@field width_source 'tag'|'default'|nil
---@field crown_m number|nil
---@field crown_source 'tag'|'default'|nil

--- Polygon (closed way with area semantics, multipolygon relation).
---@param tags OsmTags
---@param is_relation boolean|nil
---@return SealingClassification|nil
function classify_sealing.classify_polygon(tags, is_relation)
  if tags.building ~= nil then return nil end
  -- Carriageway areas (area:highway=residential, ...) are not sealing input here.
  local area_highway = tags['area:highway']
  if area_highway ~= nil and not AREA_HIGHWAY_OK[area_highway] then return nil end
  -- Not at ground level.
  if tags.amenity == 'parking' and UNGROUNDED_PARKING[tags.parking] then return nil end

  local surface, group = surface_and_group(tags)
  local type_default = polygon_type_default(tags, is_relation)
  if group then
    if not type_default and not is_area_type_object(tags) then return nil end
    return { sealing_group = group, surface_explicit = true, surface = surface }
  end
  if type_default then
    return { sealing_group = type_default, surface_explicit = false, surface = surface }
  end
  return nil
end

--- Line (non-area way): footway, cycleway, path, pedestrian, living_street.
---@param tags OsmTags
---@return SealingClassification|nil
function classify_sealing.classify_line(tags)
  local default_width = DEFAULT_LINE_WIDTH[tags.highway]
  if default_width == nil then return nil end

  local surface, group = surface_and_group(tags)
  local explicit = group ~= nil
  if not explicit then
    -- Without a surface, a `path` is as likely unsealed as sealed: not emitted.
    if tags.highway == 'path' then return nil end
    group = 'B'
  end

  local width = parse_width(tags.width)
  local width_source = 'tag'
  if width == nil or width < WIDTH_MIN or width > WIDTH_MAX then
    width = default_width
    width_source = 'default'
  end
  return {
    sealing_group = group,
    surface_explicit = explicit,
    surface = surface,
    width_m = width,
    width_source = width_source,
  }
end

--- `natural=tree` node.
---@param tags OsmTags
---@return SealingClassification|nil
function classify_sealing.classify_tree_node(tags)
  if tags.natural ~= 'tree' then return nil end
  local crown = parse_width(tags.diameter_crown)
  local crown_source = 'tag'
  if crown == nil or crown < CROWN_MIN or crown > CROWN_MAX then
    crown = DEFAULT_CROWN
    crown_source = 'default'
  end
  return {
    sealing_group = 'tree',
    surface_explicit = false,
    crown_m = crown,
    crown_source = crown_source,
  }
end

--- `natural=tree_row` way.
---@param tags OsmTags
---@return SealingClassification|nil
function classify_sealing.classify_tree_row(tags)
  if tags.natural ~= 'tree_row' then return nil end
  return {
    sealing_group = 'tree',
    surface_explicit = false,
    width_m = TREE_ROW_WIDTH,
    width_source = 'default',
  }
end

--- Line handler entry: tree rows first, then the highway lines.
---@param tags OsmTags
---@return SealingClassification|nil
function classify_sealing.classify_way_line(tags)
  return classify_sealing.classify_tree_row(tags) or classify_sealing.classify_line(tags)
end

-- Roads whose `sidewalk*` tags describe a sidewalk next to the carriageway.
local SIDEWALK_ROADS = SET.set({
  'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'road', 'service',
})

---@param tags OsmTags
---@param side 'left'|'right'
---@param key string e.g. 'width', 'surface'
---@return string|nil
local function sidewalk_value(tags, side, key)
  return tags['sidewalk:' .. side .. ':' .. key] or tags['sidewalk:both:' .. key] or tags['sidewalk:' .. key]
end

---@param tags OsmTags
---@param side 'left'|'right'
---@return boolean
local function has_sidewalk(tags, side)
  local own = tags['sidewalk:' .. side] or tags['sidewalk:both']
  if own ~= nil then return own == 'yes' end
  local sidewalk = tags.sidewalk
  return sidewalk == 'both' or sidewalk == 'yes' or sidewalk == side
end

---@class SidewalkClassification: SealingClassification
---@field offset_m number distance of the sidewalk axis from the road axis; > 0 left, < 0 right

--- Sidewalks tagged on a road (`sidewalk=both|left|right`, `sidewalk:<side>=yes`) instead of
--- mapped as own ways. `separate` / `no` give nothing (a separate way is classified on its own).
--- The worker shifts the road line by `offset_m` (half the carriageway plus half the sidewalk)
--- and buffers it by `width_m`. Unsealed sidewalk surfaces count as D.
---@param tags OsmTags
---@return SidewalkClassification[]
function classify_sealing.classify_road_sidewalks(tags)
  local result = {}
  if not SIDEWALK_ROADS[tags.highway] then return result end
  local road_width = road_width_tags(tags).value
  for _, side in ipairs({ 'left', 'right' }) do
    if has_sidewalk(tags, side) then
      local width = parse_width(sidewalk_value(tags, side, 'width'))
      local width_source = 'tag'
      if width == nil or width < WIDTH_MIN or width > WIDTH_MAX then
        width = DEFAULT_LINE_WIDTH.footway
        width_source = 'default'
      end
      local surface, group = surface_and_group({ surface = sidewalk_value(tags, side, 'surface') })
      local offset = road_width / 2 + width / 2
      table.insert(result, {
        sealing_group = group or 'B',
        surface_explicit = group ~= nil,
        surface = surface,
        width_m = width,
        width_source = width_source,
        offset_m = side == 'left' and offset or -offset,
      })
    end
  end
  return result
end

return classify_sealing
