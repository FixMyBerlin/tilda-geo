describe("parse_width", function()
  require('init')
  require("osm2pgsql")

  local logged_errors = {}
  -- Mock width_errors before requiring parse_width
  package.loaded['width_errors'] = {
    log = function(object, tag_name, invalid_value, error_msg)
      table.insert(logged_errors, {
        object = object,
        tag = tag_name,
        value = invalid_value,
        error = error_msg
      })
    end
  }

  local parse_width = require('parse_width')

  before_each(function()
    logged_errors = {}
  end)

  it('parse "1.2" as 1.2', function()
    local result = parse_width("1.2")
    assert.are.same(result, 1.2)
    assert.are.same(#logged_errors, 0)
  end)

  it('parse "1,2" (comma) as 1.2', function()
    local result = parse_width("1,2")
    assert.are.same(result, 1.2)
    assert.are.same(#logged_errors, 0)
  end)

  it('parse "3.5 m" as 3.5', function()
    local result = parse_width("3.5 m")
    assert.are.same(result, 3.5)
    assert.are.same(#logged_errors, 0)
  end)

  it('parse "3,5m" as 3.5', function()
    local result = parse_width("3,5m")
    assert.are.same(result, 3.5)
    assert.are.same(#logged_errors, 0)
  end)

  it('parse "250 cm" as 2.5', function()
    local result = parse_width("250 cm")
    assert.are.same(result, 2.5)
    assert.are.same(#logged_errors, 0)
  end)

  it('parse "250cm" as 2.5', function()
    local result = parse_width("250cm")
    assert.are.same(result, 2.5)
    assert.are.same(#logged_errors, 0)
  end)

  it('parse "1.5 km" as 1500', function()
    local result = parse_width("1.5 km")
    assert.are.same(result, 1500)
    assert.are.same(#logged_errors, 0)
  end)

  it('returns nil and does not log if empty/nil', function()
    assert.is_nil(parse_width(nil))
    assert.is_nil(parse_width(""))
    assert.are.same(#logged_errors, 0)
  end)

  it('returns nil and logs error if invalid value and object provided', function()
    local dummy_object = { id = 12345, type = "way" }
    local result = parse_width("fehlerhafter Text", dummy_object, "width")
    assert.is_nil(result)
    assert.are.same(#logged_errors, 1)
    assert.are.same(logged_errors[1].object, dummy_object)
    assert.are.same(logged_errors[1].tag, "width")
    assert.are.same(logged_errors[1].value, "fehlerhafter Text")
  end)

  it('returns nil and does not log if invalid value and NO object provided', function()
    local result = parse_width("fehlerhafter Text")
    assert.is_nil(result)
    assert.are.same(#logged_errors, 0)
  end)
end)
