describe('parse_conditional_value', function()
  local parse_conditional_value = require('topics.helper.parse_conditional_value')
  local log = require('topics.helper.log')
  it('parses single conditional value and returns list with one entry', function()
    local result = parse_conditional_value('loading_only @ (Mo-Fr 08:00-18:00)')
    assert.are.equal(#result, 1)
    assert.are.equal(result[1].value, 'loading_only')
    assert.are.equal(result[1].condition, 'Mo-Fr 08:00-18:00')
  end)

  it('parses multiple semicolon-separated conditional values', function()
    local result = parse_conditional_value('no_parking @ (Mo-Fr 06:00-18:00); no_stopping @ (Mo-Fr 09:00-12:00)')
    assert.are.equal(#result, 2)
    assert.are.equal(result[1].value, 'no_parking')
    assert.are.equal(result[2].value, 'no_stopping')
  end)

  it('handles whitespace variations', function()
    local result = parse_conditional_value('  loading_only  @  (  Mo-Fr 08:00-18:00  )  ')
    assert.are.equal(#result, 1)
    assert.are.equal(result[1].value, 'loading_only')
    assert.are.equal(result[1].condition, 'Mo-Fr 08:00-18:00')
  end)

  it('accepts `@` without spaces and non-breaking spaces', function()
    assert.are.same(parse_conditional_value('30@(22:00-06:00)'), { { value = '30', condition = '22:00-06:00' } })
    assert.are.same(parse_conditional_value('none@agricultural'), { { value = 'none', condition = 'agricultural' } })
    assert.are.same(
      parse_conditional_value('no_parking\194\160@ (Mo-Fr 07:00-17:00)'),
      { { value = 'no_parking', condition = 'Mo-Fr 07:00-17:00' } }
    )
  end)

  it('returns nil for invalid format', function()
    local result = parse_conditional_value('invalid_format')
    assert.are.equal(result, nil)
  end)

  it('returns nil for nil or empty input', function()
    assert.are.equal(parse_conditional_value(nil), nil)
    assert.are.equal(parse_conditional_value(''), nil)
  end)
end)
