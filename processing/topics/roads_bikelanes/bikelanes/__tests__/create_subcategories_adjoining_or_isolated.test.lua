describe('create_subcategories_adjoining_or_isolated', function()
  require('init')
  local bikelane_categories = require('bikelane_categories')
  local create_subcategories_adjoining_or_isolated = require('create_subcategories_adjoining_or_isolated')
  local category_is_sidepath = require('category_is_sidepath')

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
  local testCategoryAdjoining, testCategoryIsolated, testCategoryAdjoiningOrIsolated = create_subcategories_adjoining_or_isolated(testCategory, bikelane_category, category_is_sidepath)
  it('should add postfix adjoining when IsSidepath is true', function()
    local tags = { ['is_sidepath'] = 'yes' }
    assert.is_true(testCategoryAdjoining(tags))
    assert.is_false(testCategoryIsolated(tags))
    assert.is_false(testCategoryAdjoiningOrIsolated(tags))
  end)

  it('should add postfix isolated when is_sidepath is no', function()
    local tags = { ['is_sidepath'] = 'no' }
    assert.is_false(testCategoryAdjoining(tags))
    assert.is_true(testCategoryIsolated(tags))
    assert.is_false(testCategoryAdjoiningOrIsolated(tags))
  end)

  it('should add postfix adjoiningOrIsolated when is_sidepath is not defined', function()
    local tags = {}
    assert.is_false(testCategoryAdjoining(tags))
    assert.is_false(testCategoryIsolated(tags))
    assert.is_true(testCategoryAdjoiningOrIsolated(tags))
  end)
end)
