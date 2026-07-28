local SET = require('topics.helper.sets')
local highway_classes = require('topics.helper.highway_classes')
local contains_substring = require('topics.helper.contains_substring')
local to_semicolon_list = require('topics.helper.to_semicolon_list')

local ALLOWED_HIGHWAYS = SET.join_sets({
  highway_classes.trunk_motorway_classes,
  highway_classes.major_road_classes,
  highway_classes.minor_road_classes,
  highway_classes.path_classes,
})

---@param tags table<string, string | nil>
---@return string[]
local function restricted_access_tag_keys(tags)
  local restricted_tags = {}
  if tags.access == 'no' then table.insert(restricted_tags, 'access') end
  if tags.highway == 'cycleway' and tags.bicycle == 'no' then table.insert(restricted_tags, 'bicycle') end
  if tags.highway == 'footway' and tags.foot == 'no' then table.insert(restricted_tags, 'foot') end
  return restricted_tags
end

---@param tags table<string, string | nil>
---@return boolean
local function has_construction_no_access_text(tags)
  local construction_no_access_terms = {
    'construction',
    'baustelle',
  }
  local combined_text = (tags['access:reason'] or '') .. ' ' .. (tags.description or '') .. ' ' .. (tags.note or '')
  local combined_text_lower = string.lower(combined_text)
  for _, term in ipairs(construction_no_access_terms) do
    if contains_substring(combined_text_lower, term) then
      return true
    end
  end

  return false
end

---@param tags table<string, string | nil>
---@return boolean
local function has_blocked_text(tags)
  local blocked_terms = {
    'sperrung',
    'gesperrt',
    'blockiert',
    'blocked',
    'closure',
    'closed',
    'blocked off',
  }
  local combined_text = (tags.description or '') .. ' ' .. (tags.note or '')
  local combined_text_lower = string.lower(combined_text)
  for _, term in ipairs(blocked_terms) do
    if contains_substring(combined_text_lower, term) then
      return true
    end
  end

  return false
end

-- Mutate the input tags to normalize lifecycle-related OSM tagging before filtering.
---@param dest_tags table<string, string | nil>
---@return table<string, string | nil> unmodified_tags Original values overwritten by the transform.
local function transform_lifecycle_tags(dest_tags)
  local unmodified_tags = {}

  if not dest_tags.highway then return unmodified_tags end

  if ALLOWED_HIGHWAYS[dest_tags.construction] then
    unmodified_tags.highway = dest_tags.highway
    unmodified_tags.lifecycle = dest_tags.lifecycle

    dest_tags.highway = dest_tags.construction
    dest_tags.lifecycle = 'construction'
    dest_tags.construction = nil
  end

  local construction_restricted_tags = restricted_access_tag_keys(dest_tags)
  if #construction_restricted_tags > 0 and has_construction_no_access_text(dest_tags) then
    for _, tag in ipairs(construction_restricted_tags) do
      unmodified_tags[tag] = dest_tags[tag]
    end
    unmodified_tags.lifecycle = dest_tags.lifecycle

    dest_tags.lifecycle = 'construction_no_access'
    dest_tags.description = to_semicolon_list({ dest_tags.description, 'TILDA-Hinweis: Weg gesperrt aufgrund einer Baustelle.' })
    for _, tag in ipairs(construction_restricted_tags) do
      dest_tags[tag] = nil
    end
  end

  local blocked_restricted_tags = restricted_access_tag_keys(dest_tags)
  if #blocked_restricted_tags > 0 and has_blocked_text(dest_tags) then
    for _, tag in ipairs(blocked_restricted_tags) do
      unmodified_tags[tag] = dest_tags[tag]
    end
    unmodified_tags.lifecycle = dest_tags.lifecycle

    dest_tags.lifecycle = 'blocked'
    dest_tags.description = to_semicolon_list({ dest_tags.description, 'TILDA-Hinweis: Weg gesperrt (Sperrung).' })
    for _, tag in ipairs(blocked_restricted_tags) do
      dest_tags[tag] = nil
    end
  end

  return unmodified_tags
end

return transform_lifecycle_tags
