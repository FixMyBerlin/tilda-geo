-- * @desc Handle different address tagging schema.
--    Docs <https://wiki.openstreetmap.org/wiki/Key:addr:*>
-- * @returns
--   `dest` if provided with `AddressKeys` added to it.
--   Otherwise a new object of format `AddressKeys` is returned.
---comment
---@param tags OsmTags
---@param dst? table
---@return table
local function infer_address(tags, dst)
  dst = dst or {}

  dst.addr_street = tags.street or tags['addr:street']
  dst.addr_zip = tags.postcode or tags['addr:postcode']
  dst.addr_city = tags.city or tags['addr:city']
  dst.addr_number = tags.housenumber or tags['addr:housenumber']

  return dst
end

return infer_address
