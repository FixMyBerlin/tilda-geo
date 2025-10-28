require('init')
require('JoinSets')
require('HighwayClasses')
require('ContainsSubstring')
local to_semicolon_list = require('to_semicolon_list')

-- Mutate the construction tags to become our own `lifecycle` tag.
---@param destTags table<string, string | nil> The input table of OSM tags to mutate in-place
---@return table<string, string> unmodified_tags A table containing the original values that were overwritten
local function transform_lifecycle_tags(destTags)
  local unmodified_tags = {}

  if not destTags.highway then
    return unmodified_tags
  end

  -- HANDLE CONSTRUCTION TAGS
  -- Skip stuff like 'construction' (some), 'proposed', 'platform' (Haltestellen), 'rest_area' (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
  -- REMINDER: Keep in sync with `processing/topics/roads_bikelanes/helper/exclude_highways.lua` > `by_highway_class`
  local allowed_highways = JoinSets({ HighwayClasses, MajorRoadClasses, MinorRoadClasses, PathClasses })

  if allowed_highways[destTags.construction] then
    -- Store the original value for debugging
    unmodified_tags.highway = destTags.highway
    unmodified_tags.lifecycle = destTags.lifecycle

    -- Transform `highway=construction + construction=ALLOW_LIST`. Only data with missing `construction=*` is skipped.
    destTags.highway = destTags.construction
    destTags.lifecycle = 'construction'
    destTags.construction = nil
  end

  -- HANDLE CONSTRUCTION REALTED ACCESS RESTRICTIONS
  local restrictedTags = {}
  if destTags.access == 'no' then table.insert(restrictedTags, 'access') end
  if destTags.highway == 'cycleway' and destTags.bicycle == 'no' then table.insert(restrictedTags, 'bicycle') end
  if destTags.highway == 'footway' and destTags.foot == 'no' then table.insert(restrictedTags, 'foot') end

  if #restrictedTags > 0 then
    -- Check access:reason, description, or note for construction/baustelle
    local combinedText = (destTags['access:reason'] or '') .. ' ' .. (destTags.description or '') .. ' ' .. (destTags.note or '')
    local combinedTextLower = string.lower(combinedText)
    if ContainsSubstring(combinedTextLower, 'construction') or ContainsSubstring(combinedTextLower, 'baustelle') then
      -- Store the original values for debugging
      for _, tag in ipairs(restrictedTags) do
        unmodified_tags[tag] = destTags[tag]
      end
      unmodified_tags.lifecycle = destTags.lifecycle

      -- Set lifecycle to construction_no_access and remove ALL restricted tags
      destTags.lifecycle = 'construction_no_access'
      destTags.description = to_semicolon_list({ destTags.description, 'TILDA-Hinweis: Weg gesperrt aufgrund einer Baustelle.' })
      for _, tag in ipairs(restrictedTags) do
        destTags[tag] = nil
      end
    end
  end

  return unmodified_tags
end

return transform_lifecycle_tags
