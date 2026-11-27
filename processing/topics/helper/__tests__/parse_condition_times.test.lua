describe('parse_condition_times', function()
  local parse_condition_times = require('topics.helper.parse_condition_times')

  local WORKDAYS = { 'Mo', 'Tu', 'We', 'Th', 'Fr' }

  ---@param days string[]|nil
  ---@param from integer
  ---@param to integer
  ---@return ConditionTimeRule
  local function rule(days, from, to)
    return { days = days, from = from, to = to, crosses_midnight = to < from }
  end

  ---@param rules ConditionTimeRule[]
  ---@param off_days string[]|nil
  ---@param other string[]|nil
  ---@return ConditionTimes
  local function times(rules, off_days, other)
    return { rules = rules, off_days = off_days or {}, other = other or {} }
  end

  it('reads weekdays and a time range', function()
    assert.are.same(parse_condition_times('Mo-Fr 06:00-18:00'), times({ rule(WORKDAYS, 360, 1080) }))
  end)

  it('reads a time range across midnight without weekdays', function()
    local result = parse_condition_times('22:00-06:00')
    assert.are.same(result, times({ rule(nil, 1320, 360) }))
    assert.is_true(result.rules[1].crosses_midnight)
  end)

  it('accepts lowercase weekdays and hours without leading zero', function()
    assert.are.same(parse_condition_times('mo-fr 6:00-18:00'), times({ rule(WORKDAYS, 360, 1080) }))
  end)

  it('accepts spaces around the dashes', function()
    assert.are.same(parse_condition_times('Mo - Fr 06:00 - 18:00'), times({ rule(WORKDAYS, 360, 1080) }))
    assert.are.same(parse_condition_times('22:00 - 6:00'), times({ rule(nil, 1320, 360) }))
  end)

  it('keeps rules apart that are separated by a dash', function()
    assert.are.same(
      parse_condition_times('Mo-Fr 08:00-12:00 - Sa 10:00-12:00'),
      times({ rule(WORKDAYS, 480, 720), rule({ 'Sa' }, 600, 720) }, {}, { '-' })
    )
  end)

  it('accepts days glued to the time', function()
    for _, condition in ipairs({ 'Mo-Fr:07:00-16:00', 'Mo-Fr07:00-16:00', 'Mo-Fr: 07:00-16:00', 'Mo-Fr: 7:00-16:00' }) do
      assert.are.same(parse_condition_times(condition), times({ rule(WORKDAYS, 420, 960) }), condition)
    end
    assert.are.same(parse_condition_times('Mo-Fr:'), times({ rule(WORKDAYS, 0, 1440) }))
  end)

  it('accepts German weekdays and typographic dashes', function()
    assert.are.same(parse_condition_times('Di–Do 08:00–12:00'), times({ rule({ 'Tu', 'We', 'Th' }, 480, 720) }))
  end)

  it('ignores brackets and AND', function()
    assert.are.same(parse_condition_times('(Mo-Fr 06:00-18:00)'), times({ rule(WORKDAYS, 360, 1080) }))
    assert.are.same(parse_condition_times('Mo-Fr AND 07:00-17:00'), times({ rule(WORKDAYS, 420, 1020) }))
  end)

  it('reads several rules separated by `;` and `,`', function()
    assert.are.same(
      parse_condition_times('Mo-Fr 07:00-09:00,15:00-18:00; Sa 08:00-12:00'),
      times({ rule(WORKDAYS, 420, 540), rule(WORKDAYS, 900, 1080), rule({ 'Sa' }, 480, 720) })
    )
    assert.are.same(
      parse_condition_times('Mo-Fr 06:00-18:00, Sa 08:00-12:00'),
      times({ rule(WORKDAYS, 360, 1080), rule({ 'Sa' }, 480, 720) })
    )
  end)

  it('gives every rule its own list of days', function()
    local result = parse_condition_times('Mo-Fr 07:00-09:00,15:00-18:00')
    table.insert(result.rules[1].days, 'Sa')
    assert.are.same(result.rules[2].days, WORKDAYS)
  end)

  it('reads day lists, holidays and day ranges over the weekend', function()
    assert.are.same(parse_condition_times('Mo,We,Fr 08:00-12:00').rules[1].days, { 'Mo', 'We', 'Fr' })
    assert.are.same(parse_condition_times('Su,PH 09:00-22:00').rules[1].days, { 'Su', 'PH' })
    assert.are.same(parse_condition_times('Fr-Mo 20:00-24:00').rules[1].days, { 'Fr', 'Sa', 'Su', 'Mo' })
  end)

  it('treats days without a time range, 24/7 and ranges to midnight as the whole day', function()
    assert.are.same(parse_condition_times('Sa,Su'), times({ rule({ 'Sa', 'Su' }, 0, 1440) }))
    assert.are.same(parse_condition_times('24/7'), times({ rule(nil, 0, 1440) }))
    assert.are.same(parse_condition_times('00:00-00:00'), times({ rule(nil, 0, 1440) }))
    assert.are.same(parse_condition_times('Mo-Fr 06:00-24:00'), times({ rule(WORKDAYS, 360, 1440) }))
    assert.are.same(parse_condition_times('Mo-Fr 20:00-00:00'), times({ rule(WORKDAYS, 1200, 1440) }))
  end)

  it('reads end times past 24:00 as the next morning', function()
    assert.are.same(parse_condition_times('23:00-33:00'), times({ rule(nil, 1380, 540) }))
    assert.are.same(parse_condition_times('23:00-49:00').rules, {})
  end)

  it('returns days marked `off` separately', function()
    assert.are.same(
      parse_condition_times('Mo-Sa 07:00-19:00; PH off; SH off'),
      times({ rule({ 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' }, 420, 1140) }, { 'PH', 'SH' })
    )
    assert.are.same(
      parse_condition_times('06:00-19:00;Su,PH off'),
      times({ rule(nil, 360, 1140) }, { 'Su', 'PH' })
    )
    assert.are.same(
      parse_condition_times('Mo-Fr 08:00-18:00; Sa 10:00-12:00 off'),
      times({ rule(WORKDAYS, 480, 1080) }, { 'Sa' })
    )
  end)

  it('returns weather, vehicle and other conditions in `other`', function()
    assert.are.same(parse_condition_times('wet'), times({}, {}, { 'wet' }))
    assert.are.same(parse_condition_times('snow'), times({}, {}, { 'snow' }))
    assert.are.same(parse_condition_times('hgv'), times({}, {}, { 'hgv' }))
    assert.are.same(parse_condition_times('weight > 7.5'), times({}, {}, { 'weight', '>', '7.5' }))
    assert.are.same(parse_condition_times('sunset-sunrise'), times({}, {}, { 'sunset-sunrise' }))
  end)

  it('returns mixed conditions with their other atoms', function()
    assert.are.same(parse_condition_times('Mo-Fr 06:00-18:00 AND wet'), times({ rule(WORKDAYS, 360, 1080) }, {}, { 'wet' }))
    assert.are.same(parse_condition_times('weight>7.5 AND 22:00-06:00'), times({ rule(nil, 1320, 360) }, {}, { 'weight>7.5' }))
    assert.are.same(parse_condition_times('Nov-Mar 22:00-06:00'), times({ rule(nil, 1320, 360) }, {}, { 'Nov-Mar' }))
  end)

  it('does not turn days with an unreadable time into the whole day', function()
    for _, condition in ipairs({ 'Mo-Fr 06:00+', 'Mo-Fr 22:00-50:00', 'Mo-Fr 06:00-17:030', 'Mo-Fr sunset-sunrise', 'Mo-Fr wet' }) do
      local result = parse_condition_times(condition)
      assert.are.same(result.rules, {}, condition)
      assert.are_not.same(result.other, {}, condition)
    end
  end)

  it('returns nil for empty input', function()
    assert.is_nil(parse_condition_times(nil))
    assert.is_nil(parse_condition_times(''))
    assert.is_nil(parse_condition_times('  '))
  end)
end)
