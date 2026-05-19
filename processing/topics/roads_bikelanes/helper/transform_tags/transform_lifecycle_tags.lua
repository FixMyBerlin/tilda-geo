local SET = require('topics.helper.sets')
local highway_classes = require('topics.helper.highway_classes')
local contains_substring = require('topics.helper.contains_substring')
local to_semicolon_list = require('topics.helper.to_semicolon_list')

-- Mutate the construction tags to become our own `lifecycle` tag.
---@param dest_tags table<string, string | nil> The input table of OSM tags to mutate in-place
---@return table<string, string> unmodified_tags A table containing the original values that were overwritten
local function transform_lifecycle_tags(dest_tags)
  local unmodified_tags = {}

  if not dest_tags.highway then
    return unmodified_tags
  end

  -- HANDLE CONSTRUCTION TAGS
  -- Skip stuff like 'construction' (some), 'proposed', 'platform' (Haltestellen), 'rest_area' (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
  -- REMINDER: Keep in sync with `processing/topics/roads_bikelanes/helper/exclude_highways.lua` > `by_highway_class`
  local allowed_highways = SET.join_sets({
    highway_classes.trunk_motorway_classes,
    highway_classes.major_road_classes,
    highway_classes.minor_road_classes,
    highway_classes.path_classes,
  })

  if allowed_highways[dest_tags.construction] then
    -- Store the original value for debugging
    unmodified_tags.highway = dest_tags.highway
    unmodified_tags.lifecycle = dest_tags.lifecycle

    -- Transform `highway=construction + construction=ALLOW_LIST`. Only data with missing `construction=*` is skipped.
    dest_tags.highway = dest_tags.construction
    dest_tags.lifecycle = 'construction'
    dest_tags.construction = nil
  end

  -- HANDLE CONSTRUCTION REALTED ACCESS RESTRICTIONS
  local restricted_tags = {}
  if dest_tags.access == 'no' then table.insert(restricted_tags, 'access') end
  if dest_tags.highway == 'cycleway' and dest_tags.bicycle == 'no' then table.insert(restricted_tags, 'bicycle') end
  if dest_tags.highway == 'footway' and dest_tags.foot == 'no' then table.insert(restricted_tags, 'foot') end

  if #restricted_tags > 0 then
    -- Check access:reason, description, or note for construction/baustelle
    local combined_text = (dest_tags['access:reason'] or '') .. ' ' .. (dest_tags.description or '') .. ' ' .. (dest_tags.note or '')
    local combined_text_lower = string.lower(combined_text)
    if contains_substring(combined_text_lower, 'construction') or contains_substring(combined_text_lower, 'baustelle') then
      -- Store the original values for debugging
      for _, tag in ipairs(restricted_tags) do
        unmodified_tags[tag] = dest_tags[tag]
      end
      unmodified_tags.lifecycle = dest_tags.lifecycle

      -- Set lifecycle to construction_no_access and remove ALL restricted tags
      dest_tags.lifecycle = 'construction_no_access'
      dest_tags.description = to_semicolon_list({ dest_tags.description, 'TILDA-Hinweis: Weg gesperrt aufgrund einer Baustelle.' })
      for _, tag in ipairs(restricted_tags) do
        dest_tags[tag] = nil
      end
    end
  end

  -- HANDLE BLOCKED/CLOSURE ACCESS RESTRICTIONS
  -- Check for blocked/closure terms in note or description (case-insensitive)
  local blocked_terms = {
    -- German terms
    'sperrung',
    'gesperrt',
    'blockiert',
    -- English terms
    'blocked',
    'closure',
    'closed',
    'blocked off',
  }

  local restricted_tags_blocked = {}
  if dest_tags.access == 'no' then table.insert(restricted_tags_blocked, 'access') end
  if dest_tags.highway == 'cycleway' and dest_tags.bicycle == 'no' then table.insert(restricted_tags_blocked, 'bicycle') end
  if dest_tags.highway == 'footway' and dest_tags.foot == 'no' then table.insert(restricted_tags_blocked, 'foot') end

  if #restricted_tags_blocked > 0 then
    -- Check description or note for blocked/closure terms
    local combined_text_blocked = (dest_tags.description or '') .. ' ' .. (dest_tags.note or '')
    local combined_text_blocked_lower = string.lower(combined_text_blocked)

    local found_blocked_term = false
    for _, term in ipairs(blocked_terms) do
      if contains_substring(combined_text_blocked_lower, term) then
        found_blocked_term = true
        break
      end
    end

    if found_blocked_term then
      -- Store the original values for debugging
      for _, tag in ipairs(restricted_tags_blocked) do
        unmodified_tags[tag] = dest_tags[tag]
      end
      unmodified_tags.lifecycle = dest_tags.lifecycle

      -- Set lifecycle to blocked and remove ALL restricted tags
      dest_tags.lifecycle = 'blocked'
      dest_tags.description = to_semicolon_list({ dest_tags.description, 'TILDA-Hinweis: Weg gesperrt (Sperrung).' })
      for _, tag in ipairs(restricted_tags_blocked) do
        dest_tags[tag] = nil
      end
    end
  end

  return unmodified_tags
end

return transform_lifecycle_tags
