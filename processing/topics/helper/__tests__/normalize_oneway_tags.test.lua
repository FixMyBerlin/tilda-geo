describe('normalize_oneway_tags', function()
  local normalize_oneway_tags = require('topics.helper.normalize_oneway_tags')

  local function normalized(tags)
    normalize_oneway_tags(tags)
    return tags
  end

  it('turns `1` and `true` into `yes`', function()
    assert.are.same(normalized({ oneway = '1', ['oneway:bicycle'] = 'true' }), { oneway = 'yes', ['oneway:bicycle'] = 'yes' })
    assert.are.same(normalized({ ['cycleway:left:oneway'] = '1', ['sidewalk:both:oneway'] = 'true' }), { ['cycleway:left:oneway'] = 'yes', ['sidewalk:both:oneway'] = 'yes' })
  end)

  it('also cleans `construction:*` one-way tags', function()
    assert.are.same(normalized({ ['construction:oneway'] = '1', ['construction:cycleway:left:oneway'] = 'true' }), { ['construction:oneway'] = 'yes', ['construction:cycleway:left:oneway'] = 'yes' })
  end)

  it('keeps `yes`, `-1`, `no` and other values', function()
    local tags = { oneway = '-1', ['oneway:bicycle'] = 'no', ['cycleway:right:oneway'] = 'yes', ['cycleway:left:check_date:oneway'] = '1' }
    assert.are.same(normalized({ oneway = '-1', ['oneway:bicycle'] = 'no', ['cycleway:right:oneway'] = 'yes', ['cycleway:left:check_date:oneway'] = '1' }), tags)
    assert.are.same(normalized({ oneway = 'reversible' }), { oneway = 'reversible' })
  end)

  it('adds `oneway=yes` to roundabouts without a value', function()
    assert.are.same(normalized({ junction = 'roundabout' }), { junction = 'roundabout', oneway = 'yes' })
    assert.are.same(normalized({ junction = 'circular' }), { junction = 'circular', oneway = 'yes' })
    assert.are.same(normalized({ junction = 'roundabout', oneway = 'no' }), { junction = 'roundabout', oneway = 'no' })
  end)
end)
