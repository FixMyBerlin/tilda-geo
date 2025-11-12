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

-- Unnest the sides from tags for a given transformation. Examples:
-- Case 1 (Main key):
-- - `cycleway:both` -> `cycleway`
--   `<prefix>:<infix>` -> `<prefix>`
-- - `source:cycleway:both` -> `source`
--   `<metaPrefix>:<prefix>:<infix>` -> `<metaPrefix>`
-- Case 2 (Sub-key):
-- - `cycleway:left:width` -> `width`
--   `<prefix>:<infix>:SUFFIX` -> `SUFFIX`
-- - `source:cycleway:left:width` -> `source:width`
--   `<metaPrefix>:<prefix>:<infix>:SUFFIX` -> `<metaPrefix>:SUFFIX`
---@param tags table
---@param prefix string prefix to look for e.g. `cycleway`
---@param infix string? infix to look for either a side e.g. `:left`, `:right`, `:both` or `''`
---@param dest table? destination table to write to
---@param metaPrefix string? optional meta-prefix to look for e.g. `source:` or `note:`
---@return table
local function unnestPrefixedTags(tags, prefix, infix, dest, metaPrefix)
  dest = dest or {}
  local metaPrefixString = metaPrefix or ''
  local fullPrefix = metaPrefixString .. prefix .. infix
  local prefixLen = string.len(fullPrefix)

  for key, val in pairs(tags) do
    if osm2pgsql.has_prefix(key, fullPrefix) then
      if key == fullPrefix then
        -- Case 1: Main key - the primary key itself with its side
        -- Examples:
        --   fullPrefix = 'cycleway:both', key = 'cycleway:both' -> dest['cycleway'] = val
        --   fullPrefix = 'source:cycleway:both', key = 'source:cycleway:both' -> dest['source'] = val
        local destinationKey = metaPrefix and metaPrefixString:sub(1, -2) or prefix
        dest[destinationKey] = val
        dest._infix = infix
      else
        -- Case 2: Sub-key - a property/sub-key of the main key
        -- Examples:
        --   fullPrefix = 'cycleway:left', key = 'cycleway:left:width' -> extractedSuffix = 'width' -> dest['width'] = val
        --   fullPrefix = 'source:cycleway:left', key = 'source:cycleway:left:width' -> extractedSuffix = 'width' -> dest['source:width'] = val
        -- Offset of 2 due to 1-indexing and for removing the ':'
        local extractedSuffix = string.sub(key, prefixLen + 2)
        local suffixKey = string.match(extractedSuffix, '[^:]*')
        -- Validate: make sure that the first part of the suffix (`suffixKey`) is not an `infix`
        if infix ~= '' or not Set({ 'left', 'right', 'both' })[suffixKey] then
          local destinationKey = metaPrefix and (metaPrefixString .. extractedSuffix) or extractedSuffix
          dest[destinationKey] = val
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

---@class TransformedObject
---@field _side "self" | "left" | "right"
---@field _prefix string? prefix of the transformation (e.g., "cycleway", "sidewalk")
---@field _parent table? original tags from the parent object
---@field _parent_highway string? highway value from the parent object
---@field _infix string? infix that was matched (e.g., ":left", ":both", "")
---@field highway string highway value for the transformed object
--- Additional tags from unnesting (e.g., width, source:width, note, traffic_sign, etc.) are also present

---@class TransformedObjectsTable
---@field self TransformedObject the center/self object (always present)
---@field left TransformedObject | nil the left side object (nil if not present)
---@field right TransformedObject | nil the right side object (nil if not present)

-- Returns transformed objects in a structured format: { self = {...}, left = nil, right = nil }
---@param tags table input tags to transform
---@param transformations table array of CenterLineTransformation objects
---@return TransformedObjectsTable structured table with self, left, and right keys (left/right may be nil if not present)
function get_transformed_objects_table(tags, transformations)
  local center = MergeTable({}, tags)
  center._side = "self"

  ---@type TransformedObjectsTable
  local structured = {
    self = center,
    left = nil,
    right = nil
  }

  -- don't transform paths only unnest tags prefixed with `cycleway`
  if PathClasses[tags.highway] or tags.highway == 'pedestrian' then
    unnestPrefixedTags(tags, 'cycleway', '', center)
    if center.oneway == 'yes' and tags['oneway:bicycle'] ~= 'no' then
      center.traffic_sign = center.traffic_sign or center['traffic_sign:forward']
    end
    return structured
  end

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

        -- Also unnest meta-prefixed tags like `source:cycleway:left:width` -> `source:width`
        -- Meta-prefixed tags are processed after regular tags and will overwrite them.
        -- Example: `cycleway:left:source:width=foo` -> `source:width=foo`, then
        --          `source:cycleway:left:width=bar` -> `source:width=bar` (overwrites foo)
        local metaPrefixes = { 'source:', 'note:' }
        for _, metaPrefix in ipairs(metaPrefixes) do
          unnestPrefixedTags(tags, prefix, '', newObj, metaPrefix)
          unnestPrefixedTags(tags, prefix, ':both', newObj, metaPrefix)
          unnestPrefixedTags(tags, prefix, ':' .. side, newObj, metaPrefix)
        end

        -- This condition checks if we actually projected something
        if newObj._infix ~= nil then
          if transformation.filter(newObj) then
            convertDirectedTags(newObj, transformation.direction_reference)
            -- Assign to structured result (first left/right transformation wins)
            if side == 'left' and structured.left == nil then
              structured.left = newObj
            elseif side == 'right' and structured.right == nil then
              structured.right = newObj
            end
          end
        end
      end
    end
  end

  return structured
end

-- @deprecated Use get_transformed_objects_table instead.
-- Returns an array of transformed objects in order: [self, left, right, ...]
---@param tags table input tags to transform
---@param transformations table array of CenterLineTransformation objects
---@return table array of transformed objects in order: [self, left, right, ...]
function GetTransformedObjects(tags, transformations)
  local structured = get_transformed_objects_table(tags, transformations)
  local results = { structured.self }

  if structured.left ~= nil then
    table.insert(results, structured.left)
  end
  if structured.right ~= nil then
    table.insert(results, structured.right)
  end

  return results
end
