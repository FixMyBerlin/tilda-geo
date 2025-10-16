describe('transform_cycleway_both_postfix', function()
  require('init')
  require('Log')
  local transform_cycleway_both_postfix = require('transform_cycleway_both_postfix')

  it('converts cycleway=no to cycleway:both=no when no side-specific tags exist', function()
    local tags = { cycleway = 'no' }
    local unmodified = transform_cycleway_both_postfix(tags)

    assert.are.same(unmodified, { cycleway = 'no' })
    assert.are.same(tags['cycleway:both'], 'no')
    assert.are.same(tags.cycleway, nil)
  end)

  it('does not convert when cycleway:both already exists', function()
    local tags = { cycleway = 'no', ['cycleway:both'] = 'lane' }
    local unmodified = transform_cycleway_both_postfix(tags)

    assert.are.same(unmodified, {})
    assert.are.same(tags.cycleway, 'no')
    assert.are.same(tags['cycleway:both'], 'lane')
  end)

  it('does not convert when cycleway:left already exists', function()
    local tags = { cycleway = 'no', ['cycleway:left'] = 'lane' }
    local unmodified = transform_cycleway_both_postfix(tags)

    assert.are.same(unmodified, {})
    assert.are.same(tags.cycleway, 'no')
    assert.are.same(tags['cycleway:left'], 'lane')
  end)

  it('does not convert when cycleway:right already exists', function()
    local tags = { cycleway = 'no', ['cycleway:right'] = 'lane' }
    local unmodified = transform_cycleway_both_postfix(tags)

    assert.are.same(unmodified, {})
    assert.are.same(tags.cycleway, 'no')
    assert.are.same(tags['cycleway:right'], 'lane')
  end)

  it('does not convert when cycleway is not "no"', function()
    local tags = { cycleway = 'lane' }
    local unmodified = transform_cycleway_both_postfix(tags)

    assert.are.same(unmodified, {})
    assert.are.same(tags.cycleway, 'lane')
    assert.are.same(tags['cycleway:both'], nil)
  end)

  it('does not convert when cycleway does not exist', function()
    local tags = { highway = 'residential' }
    local unmodified = transform_cycleway_both_postfix(tags)

    assert.are.same(unmodified, {})
    assert.are.same(tags.cycleway, nil)
    assert.are.same(tags['cycleway:both'], nil)
  end)
end)
