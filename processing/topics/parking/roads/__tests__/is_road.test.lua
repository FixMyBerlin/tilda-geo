describe("`is_road`", function()
  require('init')
  require('Log')
  local is_road = require('is_road')

  it('ignores non highway', function()
    local tags = {
      ["foo"] = 'bar',
    }
    local result = is_road(tags)
    assert.are.equal(result, false)
  end)

  it('works for highways', function()
    local tags = {
      ["highway"] = 'residential',
    }
    local result = is_road(tags)
    assert.are.equal(result, true)
  end)

  it('ignores service highways', function()
    local tags = {
      ["highway"] = 'service',
    }
    local result = is_road(tags)
    assert.are.equal(result, false)
  end)

  it('works for construction highways', function()
    local tags = {
      ["highway"] = 'construction',
      ["construction"] = 'residential',
    }
    local result = is_road(tags)
    assert.are.equal(result, true)
  end)

  it('ignores service construction highways', function()
    local tags = {
      ["highway"] = 'construction',
      ["construction"] = 'service',
    }
    local result = is_road(tags)
    assert.are.equal(result, false)
  end)
end)
