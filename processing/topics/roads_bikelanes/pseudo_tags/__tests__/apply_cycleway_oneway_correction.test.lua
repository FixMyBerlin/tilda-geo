describe('apply_cycleway_oneway_correction', function()
  local apply = require('topics.roads_bikelanes.pseudo_tags.apply_cycleway_oneway_correction')
  local BEFORE = 1795305600 - 1 -- just before 2026-11-22T00:00:00Z
  local AFTER = 1795305600

  it('removes `cycleway:both:oneway=yes` on lanes', function()
    local tags = { highway = 'secondary', ['cycleway:both'] = 'lane', ['cycleway:both:oneway'] = 'yes', _timestamp = BEFORE }
    apply(tags)
    assert.is_nil(tags['cycleway:both:oneway'])
    assert.is_nil(tags['cycleway:left:oneway'])
    assert.is_nil(tags['cycleway:right:oneway'])
  end)

  it('sets the side defaults explicitly on tracks', function()
    local tags = { highway = 'secondary', ['cycleway:both'] = 'track', ['cycleway:both:oneway'] = 'yes', _timestamp = BEFORE }
    apply(tags)
    assert.is_nil(tags['cycleway:both:oneway'])
    assert.are.equal('-1', tags['cycleway:left:oneway'])
    assert.are.equal('yes', tags['cycleway:right:oneway'])
  end)

  it('fixes `left:oneway=yes` with a track left and a lane right, keeps `right:oneway=no`', function()
    local tags = {
      highway = 'secondary',
      ['cycleway:left'] = 'track',
      ['cycleway:right'] = 'lane',
      ['cycleway:left:oneway'] = 'yes',
      ['cycleway:right:oneway'] = 'no',
      _timestamp = BEFORE,
    }
    apply(tags)
    assert.are.equal('-1', tags['cycleway:left:oneway'])
    assert.are.equal('no', tags['cycleway:right:oneway'])
  end)

  it('removes `cycleway:oneway=yes` and `cycleway:right:oneway=yes`', function()
    local tags = { highway = 'tertiary', cycleway = 'lane', ['cycleway:oneway'] = 'yes', ['cycleway:right:oneway'] = 'yes', _timestamp = BEFORE }
    apply(tags)
    assert.is_nil(tags['cycleway:oneway'])
    assert.is_nil(tags['cycleway:right:oneway'])
  end)

  it('leaves ways edited from the cutoff on unchanged', function()
    local tags = { highway = 'secondary', ['cycleway:both'] = 'track', ['cycleway:both:oneway'] = 'yes', _timestamp = AFTER }
    apply(tags)
    assert.are.equal('yes', tags['cycleway:both:oneway'])
    assert.is_nil(tags['cycleway:left:oneway'])
  end)
end)
