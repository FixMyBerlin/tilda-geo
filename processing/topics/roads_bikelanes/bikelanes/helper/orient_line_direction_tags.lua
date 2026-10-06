-- Left-side bikelane lines run against the OSM way. OSM `*:forward` / `*:backward`
-- follow the way, so on those rows the pair is swapped to follow the line.
-- Right and centerline rows already run with the way and are left unchanged.
--
-- Pairs:
-- - `mapillary_forward` / `mapillary_backward` (shared `result_tags`, or the lane's own)
-- - `traffic_sign:forward` / `traffic_sign:backward` (lane tags)
-- Undirected fields (`mapillary`, `mapillary_traffic_sign`, `mapillary_coverage`) are not pairs.

local direction_pairs = {
  { 'mapillary_forward', 'mapillary_backward' },
  { 'traffic_sign:forward', 'traffic_sign:backward' },
}

---@param tags table
---@param side string|nil
---@return table
local function orient_line_direction_tags(tags, side)
  if side ~= 'left' then
    return tags
  end

  for _, pair in ipairs(direction_pairs) do
    local forward_key, backward_key = pair[1], pair[2]
    tags[forward_key], tags[backward_key] = tags[backward_key], tags[forward_key]
  end

  return tags
end

return orient_line_direction_tags
