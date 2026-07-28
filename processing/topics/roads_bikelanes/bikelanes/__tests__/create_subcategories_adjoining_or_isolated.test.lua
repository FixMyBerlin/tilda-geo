describe('create_subcategories_adjoining_or_isolated', function()
  local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
  local create_subcategories_adjoining_or_isolated = require('topics.roads_bikelanes.bikelanes.categories.create_subcategories_adjoining_or_isolated')

  local bikelane_category = bikelane_categories.bikelane_category
  local testCategory = bikelane_category.new({
    id = 'test',
    desc = '',
    infrastructureExists = true,
    implicitOneWay = true,
    implicitOneWayConfidence = 'low',
    copySurfaceSmoothnessFromParent = false,
    condition = function() return true end,
  })
  local testCategoryAdjoining, testCategoryIsolated, testCategoryAdjoiningOrIsolated = create_subcategories_adjoining_or_isolated(testCategory)
  it('should add postfix adjoining when IsSidepath is true', function()
    local tags = { ['is_sidepath'] = 'yes' }
    assert.is_true(testCategoryAdjoining:is_active(tags))
    assert.is_false(testCategoryIsolated:is_active(tags))
    assert.is_false(testCategoryAdjoiningOrIsolated:is_active(tags))
  end)

  it('should add postfix isolated when is_sidepath is no', function()
    local tags = { ['is_sidepath'] = 'no' }
    assert.is_false(testCategoryAdjoining:is_active(tags))
    assert.is_true(testCategoryIsolated:is_active(tags))
    assert.is_false(testCategoryAdjoiningOrIsolated:is_active(tags))
  end)

  it('should add postfix adjoiningOrIsolated when is_sidepath is not defined', function()
    local tags = {}
    assert.is_false(testCategoryAdjoining:is_active(tags))
    assert.is_false(testCategoryIsolated:is_active(tags))
    assert.is_true(testCategoryAdjoiningOrIsolated:is_active(tags))
  end)
end)
