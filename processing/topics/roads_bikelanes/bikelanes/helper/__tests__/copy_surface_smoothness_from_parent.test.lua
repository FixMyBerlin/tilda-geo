describe('copySurfaceSmoothnessFromParent', function()
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

  it('copySurfaceSmoothnessFromParent=true works for both surface and smoothness', function()
    local object_tags = {
      highway = 'cycleway',
      cycleway = 'share_busway',
      surface = 'asphalt',
      smoothness = 'good'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[1]
    local category = categorize_bikelane(transformed_tags)
    assert.are.same(category.id, 'sharedBusLaneBusWithBike')
    local surfaceResult = category and derive_bikelane_surface(transformed_tags, category)
    assert.are.same(surfaceResult.surface, 'asphalt')
    local smoothnessResult = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(smoothnessResult.smoothness, 'good')
  end)

  it('copySurfaceSmoothnessFromParent=false works for both surface and smoothness', function()
    local object_tags = {
      highway = 'secondary',
      ['cycleway:left'] = 'track',
      ['cycleway:left:surface'] = 'asphalt',
      ['cycleway:left:smoothness'] = 'good',
      surface = 'sett',
      smoothness = 'intermediate'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = categorize_bikelane(transformed_tags)
    assert.are.same(category.id, 'cycleway_adjoining')
    local surfaceResult = category and derive_bikelane_surface(transformed_tags, category)
    assert.are.same(surfaceResult.surface, 'asphalt')
    local smoothnessResult = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(smoothnessResult.smoothness, 'good')
  end)

  it('https://www.openstreetmap.org/way/825937638', function()
    local object_tags = {
      highway = 'secondary',
      ['cycleway:left'] = 'no',
      ['cycleway:right'] = 'lane',
      ['cycleway:right:lane'] = 'exclusive',
      ['cycleway:right:traffic_mode:left'] = 'parking',
      ['cycleway:right:traffic_sign'] = 'DE:237',
      dual_carriageway = 'yes',
      foot = 'use_sidepath',
      lanes = '1',
      lit = 'yes',
      maxspeed = '30',
      name = 'Boelckestraße',
      ['name:etymology:wikidata'] = 'Q57716',
      oneway = 'yes',
      ['parking:left'] = 'no',
      ['parking:left:reason'] = 'dual_carriage',
      ['parking:right'] = 'lane',
      ['parking:right:fee'] = 'no',
      ['parking:right:orientation'] = 'parallel',
      postal_code = '12101',
      ['sidewalk:left'] = 'no',
      ['sidewalk:right'] = 'separate',
      surface = 'asphalt'
    }
    local transformedObjects = get_transformed_objects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[3]
    local category = categorize_bikelane(transformed_tags)
    assert.are.same(category.id, 'cyclewayOnHighwayProtected')
    local surfaceResult = category and derive_bikelane_surface(transformed_tags, category)
    assert.are.same(surfaceResult.surface, 'asphalt')
    local smoothnessResult = category and derive_bikelane_smoothness(transformed_tags, category)
    assert.are.same(smoothnessResult.smoothness, 'good')
  end)
end)
