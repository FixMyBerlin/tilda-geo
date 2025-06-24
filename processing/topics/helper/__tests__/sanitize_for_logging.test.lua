require('init')
local sanitize_for_logging = require('sanitize_for_logging')

describe('sanitize_for_logging', function()
  it('returns value if allowed', function()
    local value = sanitize_for_logging('value_foo', {'value_foo'})
    assert.are.equal(value, 'value_foo')
  end)

  it('return nil if value nil', function()
    local value = sanitize_for_logging(nil, {'value_foo'})
    assert.are.equal(value, nil)
  end)

  it('return DISALLOWED_VALUE if value not allowed', function()
    local value = sanitize_for_logging('value_not_allowed', {'value_foo'})
    assert.are.equal(value, 'DISALLOWED_VALUE')
  end)

  it('return nil if value not ignored', function()
    local value = sanitize_for_logging('yes', {'no'}, {'yes'})
    assert.are.equal(value, nil)
  end)
end)
