describe('apply_pseudo_tags', function()
  local apply_pseudo_tags = require('topics.roads_bikelanes.pseudo_tags.apply_pseudo_tags')

  it('applies mapillary, sidepath, and settlement from a single merged row', function()
    local merged = {
      [42] = {
        mapillary_coverage = 'pano',
        is_sidepath_estimation = 'true',
      },
    }

    local tags = { highway = 'path' }
    apply_pseudo_tags(tags, 42, merged, nil)

    assert.are.equal('pano', tags.mapillary_coverage)
    assert.are.equal('assumed_yes', tags._is_sidepath)
    assert.are.equal('assumed_yes', tags._in_settlement_area)
  end)

  it('supports optional CQI sidepath columns on the merged row', function()
    local merged = {
      [7] = {
        is_sidepath_estimation = 'false',
        adjoining_road = 'secondary',
        adjoining_maxspeed = '50',
      },
    }

    local tags = { highway = 'footway' }
    apply_pseudo_tags(tags, 7, merged, nil)

    assert.are.equal('assumed_no', tags._is_sidepath)
    assert.are.equal('secondary', tags._sidepath_adjoining_road)
    assert.are.equal('50', tags._sidepath_adjoining_maxspeed)
  end)

  it('uses settlement CSV minority rows', function()
    local merged = {
      [99] = { in_settlement_area = 'assumed_no' },
    }

    local tags = { highway = 'residential' }
    apply_pseudo_tags(tags, 99, merged, nil)

    assert.are.equal('assumed_no', tags._in_settlement_area)
  end)
end)
