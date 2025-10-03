require('init')
require('MergeTable')
require('HighwayClasses')

CenterLineTransformation = {}
CenterLineTransformation.__index = CenterLineTransformation

---@param args table
--@param args.highway string
--@param args.prefix string
--@param args.direction_reference 'self' | 'parent'
--@param args.filter function?
--@return table
function CenterLineTransformation.new(args)
  local self = setmetatable({}, CenterLineTransformation)
  local mandatory = { 'highway', 'prefix', 'direction_reference' }
  for k, v in pairs(mandatory) do
    if args[v] == nil then
      error('Missing mandatory argument ' .. v .. ' for CenterLineTransformation')
    end
    self[v] = args[v]
  end
  self.filter = args.filter or function(_) return true end
  return self
end

-- unnest all tags from `["prefix .. side:subtag"]=val` -> `["subtag"]=val`
---@param tags table
---@param prefix string prefix to look for e.g. `cycleway`
---@param infix string? infix to look for either a side e.g. `:left`, `:right`, `:both` or `''`
---@param dest table? destination table to write to
---@return table
local function unnestPrefixedTags(tags, prefix, infix, dest)
  dest = dest or {}
  local fullPrefix = prefix .. infix
  local prefixLen = string.len(fullPrefix)
  for key, val in pairs(tags) do
    if osm2pgsql.has_prefix(key, fullPrefix) then
      if key == fullPrefix then -- self projection
        dest[prefix] = val
        dest._infix = infix
      else
        -- offset of 2 due to 1-indexing and for removing the ':'
        local prefixlessKey = string.sub(key, prefixLen + 2)
        local subkey = string.match(prefixlessKey, '[^:]*')
        -- make sure that `subkey` is not an infix
        if infix ~= '' or not Set({ 'left', 'right', 'both' })[subkey] then
          dest[prefixlessKey] = val
          dest._infix = infix
        end
      end
    end
  end
  return dest
end

-- tags that get projected based on the direction suffix e.g `:forward` or `:backward`
local directedTags = {
  -- these are tags that get copied from the parent
  parent = {
    'cycleway:lanes', -- becomes tags.lanes after transformation
    'bicycle:lanes',
    -- TBD: See https://github.com/FixMyBerlin/private-issues/issues/2791
    -- 'width:lanes',
    -- 'surface:lanes',
    -- 'surface:colour:lanes',
    -- 'smoothness:lanes',
    -- 'source:width:lanes',
  },
  -- these are tags that get copied from the cycleway itself
  self = {
    'traffic_sign'
  }
}

-- https://wiki.openstreetmap.org/wiki/Forward_%26_backward,_left_%26_right
local sideToDirection = {
  [''] = '',
  both = '',
  left = ':backward',
  right = ':forward',
}

-- convert all `directedTags` from `[directedTags:direction]=val` -> `[directedTags]=val`
---@param cycleway table
---@param direction_reference 'self' | 'parent' whether directions refer to the cycleway or its parent
---@return table
local function convertDirectedTags(cycleway, direction_reference)
  local parent = cycleway._parent
  local side = cycleway._side
  -- project directed keys from the center line
  for _, key in pairs(directedTags.parent) do
    local directedKey = key .. sideToDirection[side]
    cycleway[key] = cycleway[key] or parent[key] or parent[directedKey]
  end
  -- project directed keys from the side
  for _, key in pairs(directedTags.self) do
    if direction_reference == 'self' then
      cycleway[key] = cycleway[key] or cycleway[key .. ':forward']
    elseif direction_reference == 'parent' then
      local directedKey = key .. sideToDirection[side]
      cycleway[key] = cycleway[key] or cycleway[directedKey]
    end
  end
  return cycleway
end

-- these tags get transformed from the forward backward schema
function GetTransformedObjects(tags, transformations)
  local center = MergeTable({}, tags)
  center._side = "self"

  -- don't transform paths only unnest tags prefixed with `cycleway`
  if PathClasses[tags.highway] or tags.highway == 'pedestrian' then
    unnestPrefixedTags(tags, 'cycleway', '', center)
    if center.oneway == 'yes' and tags['oneway:bicycle'] ~= 'no' then
      center.traffic_sign = center.traffic_sign or center['traffic_sign:forward']
    end
    return { center }
  end

  local results = { center }
  for _, transformation in ipairs(transformations) do
    for _, side in ipairs({ "left", "right" }) do
      if tags.highway ~= transformation.highway then
        local prefix = transformation.prefix
        local newObj = {
          _prefix = prefix,
          _side = side,
          _parent = tags,
          _parent_highway = tags.highway,
          -- REFACOTRING: This should be `_highway`, see https://github.com/FixMyBerlin/private-issues/issues/2236
          highway = transformation.highway
        }

        -- We look for tags with the following hierarchy: `prefix:side` > `prefix:both` > `prefix`
        -- thus a more specific tag will always overwrite a more general one
        unnestPrefixedTags(tags, prefix, '', newObj)
        unnestPrefixedTags(tags, prefix, ':both', newObj)
        unnestPrefixedTags(tags, prefix, ':' .. side, newObj)

        -- This condition checks if we actually projected something
        if newObj._infix ~= nil then
          if transformation.filter(newObj) then
            convertDirectedTags(newObj, transformation.direction_reference)
            table.insert(results, newObj)
          end
        end
      end
    end
  end

  return results
end
