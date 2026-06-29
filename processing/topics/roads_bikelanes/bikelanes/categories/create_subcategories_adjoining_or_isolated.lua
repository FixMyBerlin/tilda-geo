local category_is_sidepath = require('topics.roads_bikelanes.bikelanes.categories.category_is_sidepath')

---@param category table BikelaneCategory instance
---@return table, table, table
local function create_subcategories_adjoining_or_isolated(category)
  local bikelane_category = getmetatable(category)

  local adjoining = bikelane_category.new({
    id = category.id .. '_adjoining',
    desc = category.desc .. ' (adjoining)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    condition = function(tags)
      return category:is_active(tags) and category_is_sidepath(tags) and tags.is_sidepath ~= 'no'
    end,
    process = category.process,
  })

  local isolated = bikelane_category.new({
    id = category.id .. '_isolated',
    desc = category.desc .. ' (isolated)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    condition = function(tags)
      return category:is_active(tags) and (tags.is_sidepath == 'no' or tags.highway == 'service' or tags.highway == 'track')
    end,
    process = category.process,
  })

  local adjoining_or_isolated = bikelane_category.new({
    id = category.id .. '_adjoiningOrIsolated',
    desc = category.desc .. ' (adjoiningOrIsolated)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    condition = function(tags)
      return category:is_active(tags) and not category_is_sidepath(tags) and tags.is_sidepath ~= 'no' and tags.highway ~= 'service' and tags.highway ~= 'track'
    end,
    process = category.process,
  })

  return adjoining, isolated, adjoining_or_isolated
end

return create_subcategories_adjoining_or_isolated
