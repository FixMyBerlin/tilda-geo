require('init')
require("Set")
require("Metadata")
require("DefaultId")

local table = osm2pgsql.define_table({
  name = 'trafficSigns',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',   not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                method = 'btree', unique = true }
  }
})

-- local trafficSignWays = osm2pgsql.define_table({
--   name = '_trafficSigns_tmp',
--   ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
--   columns = {
--     { column = 'tags', type = 'jsonb' },
--     { column = 'meta', type = 'jsonb' },
--     { column = 'geom', type = 'linestring' },
--   }
-- })

-- This table collects information about traffic signs, which are oriented by the way the belong to
-- assuming that every traffic sign belongs to at most one way this table can hold up to two entries per traffic sign.
-- That is one for its predecessor and an other for its successor. Traffic signs located at the beginning or end of a way only have one such entry.
-- A single entry holds the osm id of the traffic sign as `node_id`, and one index from which the angle is to be taken (in way direction)
local directionTable = osm2pgsql.define_table({
  name = '_trafficSignDirections',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'node_id', type = 'bigint' },
    { column = 'idx',     type = 'int' },
    { column = 'geom',    type = 'linestring' },
  },
})

-- this function is for splitting traffic signs which are tagged with the :forward :backward sign e.g. nodes containing information about two traffic signs
-- the idea is to include two db entries where the traffic_sign:backward entry is rotated by 180 degrees
local function splitDirections(tags)
  local directionOffsets = { ["forward"] = 0, ["backward"] = 180 }
  local traffic_signs = {}
  for direction, offset in pairs(directionOffsets) do
    local directedTag = "traffic_sing:" .. direction
    local both = "traffic_sing:both"
    if tags[directedTag] or tags[both] then
      traffic_signs[direction] = { ["traffic_sign"] = tags[directedTag] or tags[both], ["offset"] = offset }
    elseif tags.direction == direction or tags.direction == "both" then
      traffic_signs[direction] = { ["traffic_sign"] = tags.traffic_sign, ["offset"] = offset }
    end
  end
  if traffic_signs.forward == nil and traffic_signs.backward == nil then
    traffic_signs.forward = { ["traffic_sign"] = tags.traffic_sign, ["offset"] = 0 }
  end
  return { traffic_signs.forward, traffic_signs.backward }
end

local function cardinalDirection2Degree(direction)
  local directionMap = {
    ["north"] = 0,
    ["east"] = 90,
    ["south"] = 180,
    ["west"] = 270,
    ["N"] = 0,
    ["NNE"] = 22,
    ["NE"] = 45,
    ["ENE"] = 67,
    ["E"] = 90,
    ["ESE"] = 112,
    ["SE"] = 135,
    ["SSE"] = 157,
    ["S"] = 180,
    ["SSW"] = 202,
    ["SW"] = 225,
    ["WSW"] = 247,
    ["W"] = 270,
    ["WNW"] = 292,
    ["NW"] = 315,
    ["NNW"] = 337
  }
  return directionMap[direction]
end

local function ExitProcessing(object)
  local required_tags = { "traffic_sign", "traffic_sign:froward", "traffic_sign:backward" }
  for _, tag in pairs(required_tags) do
    if object.tags[tag] then
      return false
    end
  end
  return true
end

local to_orient = {}

function osm2pgsql.process_node(object)
  local tags = object.tags
  if ExitProcessing(object) then return end

  tags.direction = tags.direction or
  tags
  ['traffic_sign:direction']                                        -- the tag `traffic_sign:direction` depicts the same as `direction` (give the original precedence)
  local direction
  local direction_source = nil
  if tags.direction ~= nil then
    -- orinetation is given in degree
    direction = tonumber(tags.direction)
    direction_source = 'tag_degrees'
    if direction == nil then
      -- orientation is given by a cardinal direction e.g. NW
      direction = cardinalDirection2Degree(tags.direction)
      direction_source = 'tag_cardinal'
    end
    if direction == nil then -- we don't have a direction in degrees and now try to orient the traffic sign by the way it is part of
      to_orient[object.id] = true
    end
  end
  for i, traffic_sign in pairs(splitDirections(tags)) do -- here we possibly duplicate a node due to the possibility of two traffic signs per node
    traffic_sign.direction = tonumber(direction)
    traffic_sign.direction_source = direction_source
    for k, v in pairs(tags) do traffic_sign['osm_' .. k] = v end
    table:insert({
      tags = traffic_sign,
      meta = Metadata(object),
      geom = object:as_point(),
      minzoom = 0,
      id = DefaultId(object) .. '/' .. i
    })
  end
end

function osm2pgsql.process_way(object)
  if object.tags.highway == nil then return end
  local prev_idx = nil
  local prev_was_sign = false
  local prev_node_id = nil
  local is_sign = false
  for idx, id in pairs(object.nodes) do
    is_sign = to_orient[id]
    if is_sign then
      if prev_idx ~= nil then
        directionTable:insert({
          node_id = id,
          idx = prev_idx,
          geom = object:as_linestring()
        })
      end
    end
    if prev_was_sign then
      directionTable:insert({
        node_id = prev_node_id,
        idx = prev_idx,
        geom = object:as_linestring()
      })
    end
    prev_idx = idx
    prev_node_id = id
    prev_was_sign = is_sign
  end
  -- if ExitProcessing(object) then return end
  -- if object.is_closed or object.tags.traffic_sing == 'None' then return end

  -- trafficSignWays:insert({
  --   tags = object.tags,
  --   meta = Metadata(object),
  --   geom = object:as_linestring(),
  -- })
end
