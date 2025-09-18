-- Convert cycleway=opposite to the oneway-schema.
-- Docs: https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway%3Dopposite
-- This doesn't handle opposite tagging on nested tags.
function ConvertCyclewayOppositeSchema(tags)
  if tags.oneway ~= 'yes' then return end

  if tags.cycleway == 'opposite' then
    tags["cycleway"] = "no"
    tags["oneway:bicycle"] = "no"
    return
  end

  if tags.cycleway == 'opposite_lane' then
    tags["cycleway"] = nil
    tags["cycleway:right"] = "no"
    tags["cycleway:left"] = "lane"
    tags["oneway:bicycle"] = "no"
    return
  end

  if tags.cycleway == 'opposite_track' then
    tags["cycleway"] = nil
    tags["cycleway:right"] = "no"
    tags["cycleway:left"] = "track"
    tags["oneway:bicycle"] = "no"
    return
  end
end
