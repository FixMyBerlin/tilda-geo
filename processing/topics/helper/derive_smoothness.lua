-- Try to find smoothess information in the following order:
-- 1. `smoothess` tag
-- 2. `smoothess` extrapolated from `surface` data
-- 3. `smoothess` extrapolated from `tracktype` tag, mostly on `highway=track`
-- 4. `smoothess` extrapolated from `mtb:scale` tag, mostly on `highway=path`
local SET = require('topics.helper.sets')

local function normalize_smoothness(smoothness)
  if smoothness ~= nil then
    local smoothness_direct = SET.set({
      'excellent',
      'good',
      'intermediate',
      'bad',
      'very_bad'
    })
    -- We only support some smoothness values to make things easier for the user
    local smoothness_normalization = {
      ['very_good'] = 'excellent',
      ['impassable'] = 'very_bad',
      ['horrible'] = 'very_bad',
      ['very_horrible'] = 'very_bad',
    }
    if smoothness_direct[smoothness] then
      return smoothness, 'tag', 'high'
    else
      local normalized = smoothness_normalization[smoothness]
      if normalized then
        return normalized, 'tag_normalized', 'high'
      end
    end
  end
  return nil, nil, nil
end

local function derive_smoothness_from_surface(surface)
  local surface_to_smoothness = {
    ['cobblestone:flattened'] = 'bad',
    ['concrete:lanes'] = 'intermediate',
    ['concrete:plates'] = 'intermediate',
    ['stone:plates'] = 'intermediate',
    ['asphalt'] = 'good',
    ['brick'] = 'bad',
    ['cobblestone'] = 'very_bad',
    ['compacted'] = 'intermediate',
    ['concrete'] = 'intermediate',
    ['dirt'] = 'bad',
    ['earth'] = 'bad',
    ['fine_gravel'] = 'intermediate',
    ['granite'] = 'intermediate',
    ['grass_paver'] = 'bad',
    ['grass'] = 'bad',
    ['gravel'] = 'bad',
    ['gravel:lanes'] = 'bad',
    ['ground'] = 'bad',
    ['metal_grid'] = 'bad',
    ['metal'] = 'good',
    ['mud'] = 'very_bad',
    ['paved'] = 'intermediate',
    ['paving_stones'] = 'intermediate',
    ['pebblestone'] = 'very_bad',
    ['rock'] = 'very_bad',
    ['rubber'] = 'good',
    ['sand'] = 'very_bad',
    ['sett'] = 'bad',
    ['stepping_stones'] = 'bad', -- https://www.openstreetmap.org/way/669442481 Stones on grass
    ['stone'] = 'bad',
    ['tartan'] = 'good',         -- rubber https://www.google.com/search?q=tartan+paving
    ['unhewn_cobblestone'] = 'very_bad',
    ['unpaved'] = 'bad',
    ['wood'] = 'intermediate',
    ['woodchips'] = 'very_bad',
  }

  local surface_to_smoothness_non_standard_values = {
    [':plates'] = 'intermediate',
    ['asphalt;compacted'] = 'intermediate',
    ['asphalt;paving_stones'] = 'intermediate',
    ['sandstone'] = 'intermediate',
    ['asphalt:lanes'] = 'intermediate',
    ['asphalt|sett'] = 'very_bad',
    ['cobblestone;ground'] = 'bad',
    ['cobblestone;asphalt'] = 'bad',
    ['compacted;paving_s'] = 'bad',
    ['compacted;paving_stones'] = 'intermediate',
    ['dirt;grass'] = 'bad',
    ['dirt/sand'] = 'very_bad',
    ['dirt;sand'] = 'very_bad',
    ['3'] = 'bad',
    ['grass;gravel'] = 'bad',
    ['ground;grass'] = 'bad',
    ['grass;ground'] = 'bad',
    ['gravel:tracks'] = 'bad',
    ['gravel;grass'] = 'bad',
    ['fine_gravel;grass'] = 'bad',
    ['fine_gravel;ground'] = 'bad',
    ['gravel;ground'] = 'bad',
    ['gravel; grass'] = 'bad',
    ['clay'] = 'bad',
    ['paving_s;sett'] = 'bad',
    ['paving_stones;asphalt'] = 'intermediate',
    ['paving_stones;sett'] = 'bad',
    ['paving_stones:30'] = 'intermediate',
    ['sett;paving_s'] = 'bad',
    ['sett;paving_stones;cobblestone:flattened'] = 'bad',
    ['sett;paving_stones'] = 'bad',
    ['grass_unpaved'] = 'bad',
    ['grund'] = 'bad',
    ['macadam'] = 'intermediate', -- https://www.google.com/search?q=macadam
    ['paving_stonees'] = 'intermediate',
    ['tiles'] = 'bad',
  }

  if not surface then
    return nil, nil, nil, 'Please add surface=*'
  end
  local smoothness = surface_to_smoothness[surface]
  local source, confidence, todo = nil, nil, nil
  if smoothness ~= nil then
    source = 'surface_to_smoothness'
    confidence = 'medium'
  else
    smoothness = surface_to_smoothness_non_standard_values[surface]
    if smoothness then
      source = 'surface_to_smoothness'
      confidence = 'medium'
    end
  end
  return smoothness, source, confidence
end

-- https://wiki.openstreetmap.org/wiki/Key:mtb:scale
-- https://taginfo.openstreetmap.org/keys/mtb%3Ascale#values
local function derive_smoothness_from_mtb_scale(scale)
  if not scale then
    return nil, nil, nil, 'no_mtb:scale_given'
  end
  if SET.set({ '0', '0+', '0-' })[scale] then
    return 'bad', 'mtb:scale_to_smoothness', 'medium'
  end
  return 'very_bad', 'mtb:scale_to_smoothness', 'medium'
end

-- Wiki https://wiki.openstreetmap.org/wiki/Key:tracktype
-- Categories that cyclosm.org use https://github.com/cyclosm/cyclosm-cartocss-style/wiki/Tag-to-Render
-- Mapping of Smoothness<>Surface https://wiki.openstreetmap.org/wiki/Key:smoothness/Gallery
-- Mapping of Smoothness<>Surface (Legacy) https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/smoothness
local function derive_smoothness_from_track_type(type)
  if not type then
    return nil, nil, nil
  end
  local track_type_to_smoothness = {
    ['grade1'] = 'good',
    ['grade2'] = 'intermediate',
    ['grade3'] = 'bad',
    ['grade4'] = 'bad',
    ['grade5'] = 'very_bad'
  }
  local smoothness = track_type_to_smoothness[type]
  if smoothness then
    return smoothness, 'tracktype_to_smoothness', 'medium'
  end
  return nil, nil, nil
end

---@param tags OsmTags
---@return table
local function derive_smoothness(tags)
  local smoothness, smoothness_source, smoothness_confidence = normalize_smoothness(tags.smoothness)
  if smoothness == nil then
    smoothness, smoothness_source, smoothness_confidence = derive_smoothness_from_surface(tags.surface)
  end
  if smoothness == nil then
    smoothness, smoothness_source, smoothness_confidence = derive_smoothness_from_track_type(tags.tracktype)
  end
  if smoothness == nil then
    smoothness, smoothness_source, smoothness_confidence = derive_smoothness_from_mtb_scale(tags['mtb:scale'])
  end

  return { smoothness = smoothness, smoothness_source = smoothness_source, smoothness_confidence = smoothness_confidence }
end

return derive_smoothness
