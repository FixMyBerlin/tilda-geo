describe('categorize_bikelane sanitizer-dependent behavior', function()
  require('topics.helper.osm2pgsql')
  local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
  local SANITIZE_VALUES = require('topics.helper.sanitize_values')
  local categorize_bikelane = bikelane_categories.categorize_bikelane

  it('excludes cyclewayOnHighwayProtected when traffic_mode:right=motorized is sanitized to motor_vehicle', function()
    local tags = {
      highway = 'cycleway',
      ['is_sidepath'] = 'yes',
      ['separation:left'] = 'bollard',
      ['traffic_mode:right'] = 'motorized',
    }

    local category = categorize_bikelane(tags)
    assert.is_not_nil(category)
    assert.are.not_equal('cyclewayOnHighwayProtected', category.id)
  end)

  it('treats disallowed separation as missing for footAndCyclewaySegregated', function()
    local tags = {
      highway = 'cycleway',
      ['traffic_mode:right'] = 'foot',
      separation_right = SANITIZE_VALUES.disallowed,
    }

    local category = categorize_bikelane(tags)
    assert.is_not_nil(category)
    assert.are.equal('footAndCyclewaySegregated_adjoiningOrIsolated', category.id)
  end)

  it('does not treat marking values on separation keys as physical separation for PBL', function()
    local tags = {
      highway = 'cycleway',
      ['is_sidepath'] = 'yes',
      ['separation:left'] = 'solid_line',
    }

    local category = categorize_bikelane(tags)
    assert.is_not_nil(category)
    assert.are.not_equal('cyclewayOnHighwayProtected', category.id)
  end)

  it('still mutates tags through category.process on plain tables', function()
    local tags = {
      highway = 'service',
      segregated = 'no',
      bicycle = 'designated',
      foot = 'designated',
    }

    local category = categorize_bikelane(tags)
    assert.is_not_nil(category)
    assert.is_truthy(string.find(category.process and tags.description or '', 'Zufahrtsweg', 1, true))
  end)
end)
