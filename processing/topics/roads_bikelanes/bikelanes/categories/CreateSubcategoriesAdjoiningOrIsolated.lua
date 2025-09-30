---@param category table
---@return table, table, table
function CreateSubcategoriesAdjoiningOrIsolated(category)
  local adjoining = BikelaneCategory.new({
    id = category.id .. '_adjoining',
    desc = category.desc .. ' (adjoining)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    condition = function(tags)
      return category(tags) and IsSidepath(tags) and tags.is_sidepath ~= "no"
    end,
    process = category.process,
  })
  local isolated = BikelaneCategory.new({
    id = category.id .. '_isolated',
    desc = category.desc .. ' (isolated)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    condition = function(tags)
      -- `hw=service` handles `footAndCyclewayShared` on emergency access ways or driveways
      return category(tags) and (tags.is_sidepath == "no" or tags.highway == 'service')
    end,
    process = category.process,
  })
  local adjoiningOrIsolated = BikelaneCategory.new({
    id = category.id .. '_adjoiningOrIsolated',
    desc = category.desc .. ' (adjoiningOrIsolated)',
    infrastructureExists = category.infrastructureExists,
    implicitOneWay = category.implicitOneWay,
    implicitOneWayConfidence = category.implicitOneWayConfidence,
    condition = function(tags)
      -- Trigger on every value other than yes or no (not is_sidepath == yes and not is_sidepath == no)
      -- Also exclude highway=service as it's treated as isolated
      return category(tags) and not IsSidepath(tags) and tags.is_sidepath ~= "no" and tags.highway ~= 'service'
    end,
    process = category.process,
  })
  return adjoining, isolated, adjoiningOrIsolated
end
