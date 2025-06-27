-- Makes sure our sanitized `width` only holds "meter" values and only numbers
local function parse_length(length)
  local val, unit = osm2pgsql.split_unit(length, 'm')
  if val then
    if unit == 'cm' then
      return val / 100
    end
    if unit == 'm' then
      return val
    end
    if unit == 'km' then
      return val * 1000
    end
    -- Miles and such eg. https://wiki.openstreetmap.org/wiki/Key:width#Examples
    -- Units and conversion at https://wiki.openstreetmap.org/wiki/Map_features/Units#Explicit_specifications
    return nil
  end
  return nil
end

return parse_length
