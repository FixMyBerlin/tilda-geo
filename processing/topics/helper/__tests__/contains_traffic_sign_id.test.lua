describe('contains_traffic_sign_id', function()
  require('init')
  local contains_traffic_sign_id = require('contains_traffic_sign_id')

  it('works for `DE:*`', function()
    local result = contains_traffic_sign_id('DE:123,1010-20;444', '123')
    assert.are.same(result, true)
  end)

  it('works for `;*`', function()
    local result = contains_traffic_sign_id('DE:123,1010-20;444', '444')
    assert.are.same(result, true)
  end)

  it('works for `,*`', function()
    local result = contains_traffic_sign_id('DE:123,1010-20;444', '1010-20')
    assert.are.same(result, true)
  end)
end)
