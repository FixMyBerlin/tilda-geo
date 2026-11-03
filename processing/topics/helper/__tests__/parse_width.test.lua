describe('parse_width', function()
  require('topics.helper.osm2pgsql')
  local parse_width = require('topics.helper.parse_width')
  local road_width = require('topics.helper.road_width')

  it('parses like parse_length', function()
    assert.are.same(parse_width('2.5'), 2.5)
    assert.are.same(parse_width('250 cm'), 2.5)
    assert.are.same(parse_width('2,5'), 2.5)
  end)

  it('keeps unusually high values', function()
    assert.are.same(parse_width('250'), 250)
  end)

  for _, value in ipairs({ '0', '0.0', '0.00', '0 m', '-1', '-2.5 m', 'narrow' }) do
    it('return nil for "' .. value .. '"', function()
      assert.are.same(parse_width(value), nil)
    end)
  end

  it('return nil for nil', function()
    assert.are.same(parse_width(nil), nil)
  end)

  it('road_width falls back to the highway default for width=0', function()
    assert.are.same(road_width({ width = '0', highway = 'residential' }), 6)
  end)

  it('road_width uses est_width when width is not usable', function()
    assert.are.same(road_width({ width = '0', est_width = '7', highway = 'residential' }), 7)
    assert.are.same(road_width({ width = 'narrow', est_width = '7', highway = 'residential' }), 7)
  end)
end)
