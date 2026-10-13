local derive_width_with_fallback = require('topics.helper.derive_width_with_fallback')

-- Lanes beside (`left`/`right`) or inside (Mittellage) the carriageway only have a width when it is mapped.
-- Every other edge is the way itself and falls back to the default of its highway class.
---@param segment { segment_id: string, source_table: string, source_id: string, tags: OsmTags }
---@param object_tags OsmTags tags of the OSM way
---@param side SideKey
---@return number|nil
local function width_for_segment(segment, object_tags, side)
  if segment.source_table == 'bikelanes' then
    local is_the_way_itself = side == 'self' and segment.segment_id == segment.source_id
    if segment.tags.width or not is_the_way_itself then
      return segment.tags.width
    end
  end
  return derive_width_with_fallback(object_tags).width
end

return width_for_segment
