describe("parse_length", function()
  require('init')
  require("osm2pgsql")
  local parse_length = require('parse_length')

  it('parse "1.2" as 1.2', function()
    local result = parse_length("1.2")
    assert.are.same(result, 1.2)
  end)

  it('parse "120 cm" as 1.2', function()
    local result = parse_length("120 cm")
    assert.are.same(result, 1.2)
  end)

  it('parse "120cm" as 1.2', function()
    local result = parse_length("120cm")
    assert.are.same(result, 1.2)
  end)

  it('parse "120.1cm" as 1.201', function()
    local result = parse_length("120.1cm")
    assert(math.abs(result - 1.201) < 0.00001) -- Weird floating point precision issue
  end)

  it('return nil for "120 cm Weg"', function()
    local result = parse_length("120 cm Weg")
    assert.are.same(result, nil)
  end)

  it('parse "1.2m" as 1.2', function()
    local result = parse_length("1.2m")
    assert.are.same(result, 1.2)
  end)

  it('parse "1.2 m" as 1.2', function()
    local result = parse_length("1.2 m")
    assert.are.same(result, 1.2)
  end)

  it('return nil for "1,2 m"', function()
    local result = parse_length("1,2 m")
    assert.are.same(result, nil)
  end)

  it('parse "1.2 km" as 1200', function()
    local result = parse_length("1.2 km")
    assert.are.same(result, 1200)
  end)

  it('return nil for "0.6 mi"', function()
    local result = parse_length("0.6 mi")
    assert.are.same(result, nil)
  end)
end)
