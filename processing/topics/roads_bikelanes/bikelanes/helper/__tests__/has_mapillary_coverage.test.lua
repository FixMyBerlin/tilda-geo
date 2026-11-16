describe('has_mapillary_coverage', function()
  local has_mapillary_coverage = require('topics.roads_bikelanes.bikelanes.helper.has_mapillary_coverage')

  it('reads the coverage of the way itself', function()
    assert.are.equal(true, has_mapillary_coverage({ mapillary_coverage = 'regular' }))
  end)

  it('reads the coverage of the road for a lane tagged on the road', function()
    assert.are.equal(true, has_mapillary_coverage({ _parent = { mapillary_coverage = 'pano' } }))
  end)

  it('is false without coverage', function()
    assert.are.equal(false, has_mapillary_coverage({}))
    assert.are.equal(false, has_mapillary_coverage({ _parent = {} }))
  end)
end)
