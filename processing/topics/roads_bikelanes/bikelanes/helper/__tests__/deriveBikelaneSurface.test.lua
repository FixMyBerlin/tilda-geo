describe('deriveBikelaneSurface', function()
  require('init')
  require('Log')
  require('transformations')
  require('BikelaneCategories')
  require('osm2pgsql')
  local deriveBikelaneSurface = require('deriveBikelaneSurface')

  it('takes direct data if possible', function()
    local cyclewayTransformation = CenterLineTransformation.new({
      highway = 'cycleway',
      prefix = 'cycleway',
      direction_reference = 'self'
    })
    local object_tags = {
      highway = 'primary',
      ['cycleway:right'] = 'lane',
      ['cycleway:right:lane'] = 'advisory',
      ['cycleway:right:surface'] = 'asphalt',
      surface = 'paved'
    }
    local transformedObjects = GetTransformedObjects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = CategorizeBikelane(transformed_tags)
    local result = category and deriveBikelaneSurface(transformed_tags, category.id)
    assert.are.same(
      { surface = 'asphalt', surface_source = 'tag', surface_confidence = 'high' },
      result
    )
  end)

  it('takes parent data if possible', function()
    local cyclewayTransformation = CenterLineTransformation.new({
      highway = 'cycleway',
      prefix = 'cycleway',
      direction_reference = 'self'
    })
    local object_tags = {
      highway = 'primary',
      ['cycleway:right'] = 'lane',
      ['cycleway:right:lane'] = 'advisory',
      surface = 'asphalt'
    }
    local transformedObjects = GetTransformedObjects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = CategorizeBikelane(transformed_tags)
    local result = category and deriveBikelaneSurface(transformed_tags, category.id)
    assert.are.same(
      { surface = 'asphalt', surface_source = 'parent_highway_tag', surface_confidence = 'high' },
      result
    )
  end)

  it('handles parent nil case', function()
    local cyclewayTransformation = CenterLineTransformation.new({
      highway = 'cycleway',
      prefix = 'cycleway',
      direction_reference = 'self'
    })
    local object_tags = {
      highway = 'primary',
      ['cycleway:right'] = 'lane',
      ['cycleway:right:lane'] = 'advisory',
      surface = 'unkown_value_that_gets_removed_so_it_becomes_nil'
    }
    local transformedObjects = GetTransformedObjects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = CategorizeBikelane(transformed_tags)
    local result = category and deriveBikelaneSurface(transformed_tags, category.id)
    assert.are.same(
      { surface = nil, surface_source = nil, surface_confidence = nil },
      result
    )
  end)
end)
