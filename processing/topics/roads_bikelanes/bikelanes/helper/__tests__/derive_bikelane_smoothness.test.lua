describe('derive_bikelane_smoothness', function()
  require('init')
  local transformations = require('transformations')
  local bikelane_categories = require('bikelane_categories')
  local osm2pgsql = require('osm2pgsql')
  local derive_bikelane_smoothness = require('derive_bikelane_smoothness')
  local derive_bikelane_surface = require('derive_bikelane_surface')
  local categorize_bikelane = bikelane_categories.categorize_bikelane

  local cyclewayTransformation = CenterLineTransformation.new({
    highway = 'cycleway',
    prefix = 'cycleway',
    direction_reference = 'self'
  })

  it('takes direct data if possible', function()
    local object_tags = {
      highway = 'primary',
      ['cycleway:right'] = 'lane',
      ['cycleway:right:lane'] = 'advisory',
      ['cycleway:right:smoothness'] = 'good',
      smoothness = 'bad'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(
      { smoothness = 'good', smoothness_source = 'tag', smoothness_confidence = 'high' },
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
      smoothness = 'excellent'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(
      { smoothness = 'excellent', smoothness_source = 'parent_highway_tag', smoothness_confidence = 'high' },
      result
    )
  end)

  it('takes skips parent data if own surface', function()
    local cyclewayTransformation = CenterLineTransformation.new({
      highway = 'cycleway',
      prefix = 'cycleway',
      direction_reference = 'self'
    })
    local object_tags = {
      highway = 'primary',
      ['cycleway:right'] = 'lane',
      ['cycleway:right:lane'] = 'advisory',
      ['cycleway:right:surface'] = 'paved',
      smoothness = 'excellent'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(
      { smoothness = 'intermediate', smoothness_source = 'surface_to_smoothness', smoothness_confidence = 'medium' },
      result
    )
  end)

  it('takes skips parent data if own surface … unless those are the same', function()
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
      surface = 'asphalt',
      smoothness = 'excellent',
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(
      { smoothness = 'excellent', smoothness_source = 'parent_highway_tag', smoothness_confidence = 'high' },
      result
    )
  end)
end)
