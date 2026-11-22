describe('apply_pseudo_tags', function()
  local apply_pseudo_tags = require('topics.roads_bikelanes.pseudo_tags.apply_pseudo_tags')

  it('applies mapillary and sidepath from a single merged row', function()
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
    assert.is_nil(tags._in_settlement_area)
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
end)

describe('apply_pseudo_tags cycleway oneway correction', function()
  local apply_pseudo_tags = require('topics.roads_bikelanes.pseudo_tags.apply_pseudo_tags')

  it('corrects only listed ways', function()
    local merged = { [1] = { cycleway_oneway_correction = true } }
    local listed = { highway = 'secondary', ['cycleway:both'] = 'lane', ['cycleway:both:oneway'] = 'yes', _timestamp = 0 }
    local other = { highway = 'secondary', ['cycleway:both'] = 'lane', ['cycleway:both:oneway'] = 'yes', _timestamp = 0 }
    apply_pseudo_tags(listed, 1, merged, nil)
    apply_pseudo_tags(other, 2, merged, nil)
    assert.is_nil(listed['cycleway:both:oneway'])
    assert.are.equal('yes', other['cycleway:both:oneway'])
  end)
end)
