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
    assert.are.equal('no_parking', condition_category_primary('no_stopping (Mo-Fr 06:00-09:00);no_parking'))
    assert.are.equal('disabled', condition_category_primary('disabled_private;disabled'))
  end)

  -- Real Berlin parkings, target state from FixMyBerlin/private-issues#3193
  it('prefers special-use spaces over prohibitions and time_limited over zone rules', function()
    local cases = {
      { 'taxi', 'no_stopping (Mo-Fr 08:00-16:00);taxi (Mo-Fr 08:00-16:00);paid (Mo-Fr 16:00-20:00, Sa 09:00-18:00)' },
      { 'loading', 'no_stopping (Mo-Fr 07:00-18:00, Sa 09:00-16:00);loading (Mo-Fr 09:00-14:00)' },
      { 'taxi', 'bus_lane (05:00-19:00);taxi (19:00-05:00)' },
      { 'loading', 'bus_lane (06:00-09:00, 14:00-22:00);loading (Mo-Fr 09:00-14:00)' },
      { 'disabled', 'bus_lane (Mo-Fr 06:00-09:00, 15:00-19:00);disabled (Mo-Fr 09:00-15:00)' },
      { 'taxi', 'charging;taxi' },
      { 'time_limited', 'mixed (Mo-Fr 09:00-20:00, Sa 09:00-18:00);time_limited (1 hour) (Mo-Fr 09:00-18:00, Sa 09:00-14:00)' },
    }
    for _, case in ipairs(cases) do
      assert.are.equal(case[1], condition_category_primary(case[2]))
    end
  end)

  it('ranks invalid last', function()
    assert.are.equal('invalid', condition_category_primary('invalid'))
    assert.are.equal('free', condition_category_primary('invalid; free'))
  end)
end)
