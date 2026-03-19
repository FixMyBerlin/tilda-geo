describe('derive_bikelane_surface', function()
  require('init')
  local log = require('log')
  local transformations = require('transformations')
  local bikelane_categories = require('bikelane_categories')
  local osm2pgsql = require('osm2pgsql')
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
      ['cycleway:right:surface'] = 'asphalt',
      surface = 'paved'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_surface(transformed_tags, category)
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
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_surface(transformed_tags, category)
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
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    local result = category and derive_bikelane_surface(transformed_tags, category)
    assert.are.same(
      result,
      { surface = nil, surface_source = nil, surface_confidence = nil }
    )
  end)
end)
