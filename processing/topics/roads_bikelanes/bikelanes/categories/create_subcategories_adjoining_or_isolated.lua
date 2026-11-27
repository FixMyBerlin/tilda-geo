local SIDEPATH = require('topics.roads_bikelanes.bikelanes.categories.category_is_sidepath')

---@param category table BikelaneCategory instance
---@return table, table, table
local function create_subcategories_adjoining_or_isolated(category)
  local bikelane_category = getmetatable(category)

  -- The riding direction without a `oneway`-tag follows the position, not the category (StVO § 2 Abs. 4):
  -- a path next to the road may only be used on the right in the direction of travel (left only with
  -- a sign), a path away from roads in both directions.
  -- Without position (`_adjoiningOrIsolated`) the category decides.
  -- See https://github.com/FixMyBerlin/tilda-geo/pull/424.

  local adjoining = bikelane_category.new({
    id = category.id .. '_adjoining',
    position = 'adjoining',
    desc = category.desc .. ' (adjoining)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = true,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    copySurfaceSmoothnessFromParent = category.copySurfaceSmoothnessFromParent,
    bicycleSurface = category.bicycleSurface,
    condition = function(tags)
      return category:is_active(tags) and SIDEPATH.category_is_sidepath(tags) and tags.is_sidepath ~= 'no'
    end,
    process = category.process,
  })

  local isolated = bikelane_category.new({
    id = category.id .. '_isolated',
    position = 'isolated',
    desc = category.desc .. ' (isolated)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = false,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    copySurfaceSmoothnessFromParent = category.copySurfaceSmoothnessFromParent,
    bicycleSurface = category.bicycleSurface,
    condition = function(tags)
      return category:is_active(tags) and (tags.is_sidepath == 'no' or tags.highway == 'service' or tags.highway == 'track')
    end,
    process = category.process,
  })

  local adjoining_or_isolated = bikelane_category.new({
    id = category.id .. '_adjoiningOrIsolated',
    position = 'adjoiningOrIsolated',
    desc = category.desc .. ' (adjoiningOrIsolated)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    copySurfaceSmoothnessFromParent = category.copySurfaceSmoothnessFromParent,
    bicycleSurface = category.bicycleSurface,
    condition = function(tags)
      return category:is_active(tags) and not SIDEPATH.category_is_sidepath(tags) and tags.is_sidepath ~= 'no' and tags.highway ~= 'service' and tags.highway ~= 'track'
    end,
    process = category.process,
  })

  return adjoining, isolated, adjoining_or_isolated
end

return create_subcategories_adjoining_or_isolated
