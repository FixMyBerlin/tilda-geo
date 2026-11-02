-- Decimal commas in `width`. These are the values used more than 10 times on highways in Germany
-- (Geofabrik extract 2026-10). Every other comma value stays unreadable: it returns nil and shows
-- up in the `unusual_width` todo, so it gets fixed in OSM.
local decimal_comma_values = {
  ['0,3'] = '0.3',
  ['0,5'] = '0.5',
  ['0,6'] = '0.6',
  ['1,5'] = '1.5',
  ['2,2'] = '2.2',
  ['2,5'] = '2.5',
  ['2,50'] = '2.50',
}

-- Makes sure our sanitized `width` only holds 'meter' values and only numbers
-- A negative length can only be a typo. 0 is allowed here, `buffer=0` means there is no buffer.
-- Use `parse_width` when 0 makes no sense.
local function parse_length(length)
  local val, unit = osm2pgsql.split_unit(decimal_comma_values[length] or length, 'm')
  if val and val >= 0 then
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
