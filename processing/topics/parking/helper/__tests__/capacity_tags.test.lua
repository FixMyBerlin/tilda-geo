require('init')
require('Log')

describe('capacity_tags', function()
  local capacity_tags = require('capacity_tags')

  it('returns value from capacity with high confidence and tag source when only capacity is set', function()
    local tags = { capacity = '10' }
    local result = capacity_tags(tags)
    assert.are.equal(result.value, 10)
    assert.are.equal(result.confidence, 'high')
    assert.are.equal(result.source, 'tag')
  end)

  it('returns value from est_capacity with medium confidence and tag_estimation source when only est_capacity is set', function()
    local tags = { est_capacity = '20' }
    local result = capacity_tags(tags)
    assert.are.equal(result.value, 20)
    assert.are.equal(result.confidence, 'medium')
    assert.are.equal(result.source, 'tag_estimation')
  end)

  it('prefers capacity over est_capacity when both are set', function()
    local tags = { capacity = '5', est_capacity = '20' }
    local result = capacity_tags(tags)
    assert.are.equal(result.value, 5)
    assert.are.equal(result.confidence, 'high')
    assert.are.equal(result.source, 'tag')
  end)

  it('returns all nil when neither capacity nor est_capacity is set', function()
    local tags = {}
    local result = capacity_tags(tags)
    assert.are.equal(result.value, nil)
    assert.are.equal(result.confidence, nil)
    assert.are.equal(result.source, nil)
  end)

  it('returns all nil when est_capacity is present but non-numeric', function()
    local tags = { est_capacity = 'many' }
    local result = capacity_tags(tags)
    assert.are.equal(result.value, nil)
    assert.are.equal(result.confidence, nil)
    assert.are.equal(result.source, nil)
  end)

  it('returns all nil when est_capacity is empty string', function()
    local tags = { est_capacity = '' }
    local result = capacity_tags(tags)
    assert.are.equal(result.value, nil)
    assert.are.equal(result.confidence, nil)
    assert.are.equal(result.source, nil)
  end)
end)
