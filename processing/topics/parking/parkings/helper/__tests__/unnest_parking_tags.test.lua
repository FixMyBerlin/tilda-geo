describe('`unnest_parking_tags`', function()
  require('init')
  local unnest_parking_tags = require('unnest_parking_tags')
  local log = require('log')
  local osm2pgsql = require('osm2pgsql')
  local inspect = require('inspect')

  it('does nothing when not postfix given', function()
    local raw_tags = {
      ['foo'] = 'bar',
    }
    local result = {}
    unnest_parking_tags(raw_tags, ':both', result)
    assert.are.equal(inspect(result), '{}')
  end)

  it('does nothing when wrong postfix given', function()
    local raw_tags = {
      ['foo'] = 'bar',
      ['parking:both:orientation'] = 'bar',
    }
    local result = {}
    unnest_parking_tags(raw_tags, ':foobar', result)
    assert.are.equal(inspect(result), '{}')
  end)

  it('resolves postfix :both', function()
    local raw_tags = {
      ['foo'] = 'bar',
      ['parking:both'] = 'lane',
      ['parking:both:orientation'] = 'bar',
    }
    local result = {}
    unnest_parking_tags(raw_tags, ':both', result)
    assert.are.same(result, { orientation = 'bar', parking = 'lane' })
  end)

  it('resolves postfix :left', function()
    local raw_tags = {
      ['foo'] = 'bar',
      ['parking:left:orientation'] = 'bar',
    }
    local result = {}
    unnest_parking_tags(raw_tags, ':left', result)
    assert.are.same(result, { orientation = 'bar' })
  end)

  it('resolves postfix :right', function()
    local raw_tags = {
      ['foo'] = 'bar',
      ['parking:right:orientation'] = 'bar',
    }
    local result = {}
    unnest_parking_tags(raw_tags, ':right', result)
    assert.are.same(result, { orientation = 'bar' })
  end)

  it('resolves postfix :nil', function()
  local raw_tags = {
      ['foo'] = 'bar',
      ['parking:orientation'] = 'bar',
      ['parking:fee'] = 'bar',
    }
    local result = {}
    unnest_parking_tags(raw_tags, '', result)
    assert.are.same(result, { fee = 'bar', orientation = 'bar' })
  end)

  it('handles all three cases', function()
    local raw_tags = {
      ['foo'] = 'bar',
      ['parking:orientation'] = 'foo1',
      ['parking:both:orientation'] = 'foo2',
      ['parking:left:orientation'] = 'foo3',
    }
    local result = {}
    unnest_parking_tags(raw_tags, '', result)
    unnest_parking_tags(raw_tags, ':both', result)
    unnest_parking_tags(raw_tags, ':left', result)
    assert.are.same(result, { orientation = 'foo3' })
  end)

end)
