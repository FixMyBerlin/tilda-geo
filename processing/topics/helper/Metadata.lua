require('init')
require("TimeUtils")
require('Log')

-- * @desc Metadata of the given osm object
-- * @returns `meta` object
function Metadata(object)
  local meta = {
    -- Reminder: Age of last tag modification; just moving the nodes don't touch the timestamp; but adding/removing nodes does
    ["updated_at"] = object.timestamp,
    -- ["updated_age"] = AgeInDays(object.timestamp),
    -- Not present in anonymized osm file:
    -- See https://osm2pgsql.org/doc/manual.html#extra-attributes
    -- See https://osm2pgsql.org/doc/manual.html#processing-callbacks
    ["updated_by"] = object.user,
    ["changeset_id"] = object.changeset,
    -- Disabled to reduce space:
    -- ["version"] = object.version,
    -- ["osm_url"] = "https://osm.org/" .. object.type .. "/" .. object.id
  }
  return meta
end
