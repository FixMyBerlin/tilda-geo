describe('condition_syntax', function()
  local SYNTAX = require('topics.parking.helper.condition_syntax')

  describe('normalize', function()
    it('rewrites unambiguous mapper mistakes', function()
      local cases = {
        ['Mo-FR 07:00-18:00'] = 'Mo-Fr 07:00-18:00',
        ['MO-FR 06:00-20:00'] = 'Mo-Fr 06:00-20:00',
        ['mo-sa 06:00-22:00'] = 'Mo-Sa 06:00-22:00',
        ['Mo-Do 07:00-14:00'] = 'Mo-Th 07:00-14:00',
        ['Mi, Do 07:00-10:00'] = 'We, Th 07:00-10:00',
        ['Sa-So 07:00-19:00'] = 'Sa-Su 07:00-19:00',
        ['13:00-9:00'] = '13:00-09:00',
        ['Sa 6:00-8:00, 14:00-16:00'] = 'Sa 06:00-08:00, 14:00-16:00',
        ['Mo–Fr 18:00–24:00'] = 'Mo-Fr 18:00-24:00',
        ['weightrating>7.5'] = 'maxweightrating > 7.5',
        ['Th[1] 07:00-09:00'] = 'Th[1] 07:00-09:00',
        ['Mo-Fr 06:00-18'] = 'Mo-Fr 06:00-18:00',
        ['Sa 09-14:00'] = 'Sa 09:00-14:00',
        ['Mo-Fr 07:00-0900'] = 'Mo-Fr 07:00-09:00',
        ['SA 12:00.18:00'] = 'Sa 12:00-18:00',
        ['Dec 24-26'] = 'Dec 24-26',
        ['30-60'] = '30-60',
      }
      for input, expected in pairs(cases) do
        assert.are.equal(expected, SYNTAX.normalize(input))
      end
    end)

    it('keeps comments in quotes and valid values untouched', function()
      assert.are.equal('Mo-Fr 08:00-18:00 AND "So nicht"', SYNTAX.normalize('Mo-Fr 08:00-18:00 AND "So nicht"'))
      assert.are.equal('Mo-Fr 08:00-18:00; PH off', SYNTAX.normalize('Mo-Fr 08:00-18:00; PH off'))
    end)
  end)

  describe('is_known', function()
    it('accepts simple and complex valid conditions', function()
      for _, condition in ipairs({
        'Mo-Fr 08:00-18:00',
        '08:00-18:00,20:00-22:00',
        'Mo-Sa 00:00-09:00, Su, residents',
        'Mo, We-Sa 00:00-09:00, 22:00-24:00, Tu 00:00-12:00, 22:00-24:00, Su',
        'Mo-Fr 08:00-18:00; PH off',
        'Th[1] 07:00-09:00',
        'Apr-Oct: Mo-Fr 09:00-18:00',
        'Dec 24-26',
        'May 13-Sep 30: 12:00-20:00',
        'Mar 01 - Oct 31: Mo-Sa 06:00-16:00',
        'Mo-Fr 09:00-17:00, Nov 26-Dec 23 Sa 09:00-17:00',
        '24/7',
        'stay > 1 hour',
        'stay <= 20 minutes',
        'customers AND stay < 1 hour',
        'maxweightrating > 7.5',
        'residents',
        'Mo-Fr 08:00-18:00 AND "doctors"',
        'Sa 18:00+',
      }) do
        assert.is_true(SYNTAX.is_known(condition), condition)
      end
    end)

    it('rejects broken conditions', function()
      for _, condition in ipairs({
        'Mo-Fr 0.00-14:00',
        'Mo-Fr 08:000-18:00',
        'Mo-Sa 07:00-11-00',
        'Mo-Fr 076:00-09:00',
        'Mo-Fr 07:00-??:??',
        'Mo-S 07:00-19:00',
        'Mo-Fr- 06:00-18:00',
        'Mo-Fr 08:00-18:99',
        'Dienstparkplatz',
      }) do
        assert.is_false(SYNTAX.is_known(SYNTAX.normalize(condition)), condition)
      end
    end)
  end)

  it('clean replaces only the unknown atoms', function()
    assert.are.equal('Mo-Fr 06:00-20:00, Sa other_condition', SYNTAX.clean('Mo-Fr 06:00-20:00, Sa 076:00-09:00'))
    assert.are.equal('2 hours', SYNTAX.clean('2 hours'))
    assert.are.equal('only motorcar, hgv', SYNTAX.clean('only motorcar, hgv'))
    assert.are.equal('customers, Mo-Fr 08:00-18:00', SYNTAX.clean('customers, Mo-Fr 08:00-18:00'))
  end)
end)
