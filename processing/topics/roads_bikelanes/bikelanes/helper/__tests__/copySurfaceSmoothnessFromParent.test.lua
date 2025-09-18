describe('copySurfaceSmoothnessFromParent', function()
  require('init')
  require('transformations')
  require('BikelaneCategories')
  require('osm2pgsql')
  local deriveBikelaneSmoothness = require('deriveBikelaneSmoothness')
  local deriveBikelaneSurface = require('deriveBikelaneSurface')

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
    local transformedObjects = GetTransformedObjects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[1]
    local category = CategorizeBikelane(transformed_tags)
    assert.are.same(category.id, 'sharedBusLaneBusWithBike')
    local surfaceResult = category and deriveBikelaneSurface(transformed_tags, category)
    assert.are.same(surfaceResult.surface, 'asphalt')
    local smoothnessResult = category and deriveBikelaneSmoothness(transformed_tags, category)
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
    local transformedObjects = GetTransformedObjects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[2]
    local category = CategorizeBikelane(transformed_tags)
    assert.are.same(category.id, 'cycleway_adjoining')
    local surfaceResult = category and deriveBikelaneSurface(transformed_tags, category)
    assert.are.same(surfaceResult.surface, 'asphalt')
    local smoothnessResult = category and deriveBikelaneSmoothness(transformed_tags, category)
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
    local transformedObjects = GetTransformedObjects(object_tags, { cyclewayTransformation })
    local transformed_tags = transformedObjects[3]
    local category = CategorizeBikelane(transformed_tags)
    assert.are.same(category.id, 'cyclewayOnHighwayProtected')
    local surfaceResult = category and deriveBikelaneSurface(transformed_tags, category)
    assert.are.same(surfaceResult.surface, 'asphalt')
    local smoothnessResult = category and deriveBikelaneSmoothness(transformed_tags, category)
    assert.are.same(smoothnessResult.smoothness, 'good')
  end)
end)
