describe('parse_length', function()
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local parse_length = require('topics.helper.parse_length')

  it('parse 1.2 as 1.2', function()
    local result = parse_length('1.2')
    assert.are.same(result, 1.2)
  end)

  it('parse 120 cm as 1.2', function()
    local result = parse_length('120 cm')
    assert.are.same(result, 1.2)
  end)

  it('parse 120cm as 1.2', function()
    local result = parse_length('120cm')
    assert.are.same(result, 1.2)
  end)

  it('parse 120.1cm as 1.201', function()
    local result = parse_length('120.1cm')
    assert(math.abs(result - 1.201) < 0.00001) -- Weird floating point precision issue
  end)

  it('return nil for 120 cm Weg', function()
    local result = parse_length('120 cm Weg')
    assert.are.same(result, nil)
  end)

  it('parse 1.2m as 1.2', function()
    local result = parse_length('1.2m')
    assert.are.same(result, 1.2)
  end)

  it('parse 1.2 m as 1.2', function()
    local result = parse_length('1.2 m')
    assert.are.same(result, 1.2)
  end)

  it('return nil for 1,2 m', function()
    local result = parse_length('1,2 m')
    assert.are.same(result, nil)
  end)

  it('parse 1.2 km as 1200', function()
    local result = parse_length('1.2 km')
    assert.are.same(result, 1200)
  end)

  it('return nil for 0.6 mi', function()
    local result = parse_length('0.6 mi')
    assert.are.same(result, nil)
  end)

  it('parse 3 with a trailing space as 3', function()
    assert.are.same(parse_length('3 '), 3)
  end)

  it('return nil for nil', function()
    assert.are.same(parse_length(nil), nil)
  end)

  -- Values of `width` on highways in Germany (Geofabrik extract 2026-10) that `tonumber` can't read.
  describe('OSM variants without a clear single value', function()
    local variants = {
      -- Decimal comma outside of our lookup
      '5,7', '0,8', '0,5m', ',5',
      -- Negative
      '-1', '-2 m',
      -- Lists and ranges
      '0.5;1', '1;1.5', '=;%', '1-2', '0,5 - 1', '2-3m', '0.5 to 1',
      -- Units we do not convert or that are misspelled
      '3M', '3 Meter', '1c', '2 mm', '2 mtr', '3 ft', '6\'', '"', '2q',
      -- Whitespace the unit pattern does not allow
      '3  m', ' 3', '2 5',
      -- Text
      'narrow', 'Weg', 'FIXME', '< 0.5', 'ca. 3',
      -- Not a number
      '3..5', '.', '-', '',
    }

    for _, value in ipairs(variants) do
      it('return nil for "' .. value .. '"', function()
        assert.are.same(parse_length(value), nil)
      end)
    end
  end)

  describe('common decimal commas', function()
    local variants = {
      ['0,3'] = 0.3,
      ['0,5'] = 0.5,
      ['0,6'] = 0.6,
      ['1,5'] = 1.5,
      ['2,2'] = 2.2,
      ['2,5'] = 2.5,
      ['2,50'] = 2.5,
    }

    for value, expected in pairs(variants) do
      it('parse ' .. value .. ' as ' .. expected, function()
        assert.are.same(parse_length(value), expected)
      end)
    end
  end)

  it('keeps 0 for `buffer=0`', function()
    assert.are.same(parse_length('0'), 0)
    assert.are.same(parse_length(0), 0)
  end)

  it('only ever returns a number or nil', function()
    local variants = { '3', '0', '0.0', '250', '.5', '5.', '1.2.3', '1.2.3 m', '3 m', '100 cm' }
    for _, value in ipairs(variants) do
      local result = parse_length(value)
      assert.is_true(result == nil or type(result) == 'number', value)
    end
  end)
end)
