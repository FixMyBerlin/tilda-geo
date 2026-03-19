describe('transform_point_direction_tags', function()
  require('init')
  local tablex = require('pl.tablex')
  local log = require('log')
  local transform_point_direction_tags = require('transform_point_direction_tags')

  it('has a key:right and removes direction for forward', function()
    local tags = { direction = 'forward', foo = 'bar', mykey = 'myvalue' }
    local rep = transform_point_direction_tags(tags, '_side_key_mykey')
    assert.are.equal(tags['_side_key_mykey'], 'right')
    assert.are.equal(tablex.size(tags), 4)
    assert.are.same(rep, {})
  end)

  it('has a key:left and removes direction for backward', function()
    local tags = { direction = 'backward', foo = 'bar', mykey = 2 }
    local rep = transform_point_direction_tags(tags, '_side_key_mykey')
    assert.are.equal(tags['_side_key_mykey'], 'left')
    assert.are.equal(tablex.size(tags), 4)
    assert.are.same(rep, {})
  end)

  it('has a key:both and removes direction for both', function()
    local tags = { direction = 'both', foo = 'bar', mykey = 3 }
    local rep = transform_point_direction_tags(tags, '_side_key_mykey')
    assert.are.equal(tags['_side_key_mykey'], 'both')
    assert.are.equal(tablex.size(tags), 4)
    assert.are.same(rep, {})
  end)

  it('returns nothing if the wrong direction values is used', function()
    local tags = { direction = 'up', foo = 'bar', mykey = 4 }
    local rep = transform_point_direction_tags(tags, '_side_key_mykey')
    assert.are.equal(tablex.size(tags), 3)
    assert.are.same(rep, { direction = 'up' })
  end)

  it('treats a missing direction tag as both', function()
    local tags = { foo = 'bar', mykey = 5 }
    local rep = transform_point_direction_tags(tags, '_side_key_mykey')
    assert.are.equal(tags['_side_key_mykey'], 'both')
    assert.are.equal(tablex.size(tags), 3)
    assert.are.same(rep, {})
  end)
end)
