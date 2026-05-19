describe('sanitize_traffic_sign', function()
  local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')

  -- Cleanup
  it('renames `no` to `none`', function()
    assert.are.same(sanitize_traffic_sign('no'), 'none')
  end)

  it('renames `DE:SPACE` to `DE:`', function()
    assert.are.same(sanitize_traffic_sign('DE: 123'), 'DE:123')
  end)

  it('renames `DE234` to `DE:234`', function()
    assert.are.same(sanitize_traffic_sign('DE234'), 'DE:234')
  end)

  it('renames `DE1010` to `DE:1010`', function()
    assert.are.same(sanitize_traffic_sign('DE1010'), 'DE:1010')
  end)

  it('renames `D:234` to `DE:234`', function()
    assert.are.same(sanitize_traffic_sign('D:234'), 'DE:234')
  end)

  it('renames `de:234` to `DE:234`', function()
    assert.are.same(sanitize_traffic_sign('de:234'), 'DE:234')
  end)

  it('renames `234` to `DE:234`', function()
    assert.are.same(sanitize_traffic_sign('234'), 'DE:234')
  end)

  it('renames `1010` to `DE:1010`', function()
    assert.are.same(sanitize_traffic_sign('1010'), 'DE:1010')
  end)

  it('renames `DE.234` to `DE:234`', function()
    assert.are.same(sanitize_traffic_sign('DE.234'), 'DE:234')
  end)

  it('cleans spaces `DE:123, 1010; 234` to `DE:123,1010;234`', function()
    assert.are.same(sanitize_traffic_sign('DE:123, 1010; 234'), 'DE:123,1010;234')
  end)

  -- Allow
  it('allows `DE:234`', function()
    assert.are.same(sanitize_traffic_sign('DE:234'), 'DE:234')
  end)

  it('allows `DE:1010`', function()
    assert.are.same(sanitize_traffic_sign('DE:1010'), 'DE:1010')
  end)

  it('allows `none` as value', function()
    assert.are.same(sanitize_traffic_sign('none'), 'none')
  end)

  it('handles nil', function()
    assert.are.same(sanitize_traffic_sign(nil), nil)
  end)

  it('handles descriptive German traffic signs with forward slash', function()
    assert.are.same(sanitize_traffic_sign('Rad/Fuß: Fußgänger haben Vorrang.'), 'Rad/Fuß: Fußgänger haben Vorrang.')
  end)
end)
