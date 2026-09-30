describe('condition_category_primary', function()
  local condition_category_primary = require('topics.parking.helper.condition_category_primary')

  it('returns default for nil, empty and unknown', function()
    assert.are.equal('default', condition_category_primary(nil))
    assert.are.equal('default', condition_category_primary(''))
    assert.are.equal('default', condition_category_primary('no_standing'))
  end)

  it('returns a single base', function()
    assert.are.equal('paid', condition_category_primary('paid'))
  end)

  it('strips the detail in parentheses', function()
    assert.are.equal('no_parking', condition_category_primary('no_parking (Mo-Fr 08:00-18:00)'))
  end)

  it('picks by priority, not by segment order', function()
    assert.are.equal('no_stopping', condition_category_primary('paid; no_stopping (Mo-Fr 07:00-09:00)'))
    assert.are.equal('paid', condition_category_primary('time_limited (1 hour); paid'))
  end)

  it('ranks invalid last', function()
    assert.are.equal('invalid', condition_category_primary('invalid'))
    assert.are.equal('free', condition_category_primary('invalid; free'))
  end)
end)
