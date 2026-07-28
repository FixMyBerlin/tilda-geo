
local function capacity_normalization(tags)
  local capacities = { capacity = tonumber(tags.capacity) }
  if capacities.capacity == nil then return capacities end

  for key, val in pairs(tags) do
    if osm2pgsql.has_prefix(key, 'capacity:') then
      val = tonumber(val)
      if val ~= nil then
        capacities.capacity = capacities.capacity - val
        capacities[key] = val
      end
    end
  end
  for k, v in pairs(capacities) do
    if v == 0 then
      capacities[k] = nil
    end
  end

  return capacities
end

return capacity_normalization
