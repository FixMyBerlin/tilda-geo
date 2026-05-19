local sanitize_string = require('topics.helper.sanitize_string')

describe('sanitize_string', function()
  it('preserves common punctuation and quotes', function()
    local input = [[A "quoted" road's #42 & co. = ok?]]
    assert.are.equal(sanitize_string(input), input)
  end)

  it('preserves unicode characters', function()
    local input = 'Straße São Tomé Łódź'
    assert.are.equal(sanitize_string(input), input)
  end)

  it('neutralizes html angle brackets while keeping content', function()
    local input = '<script>alert(1)</script>'
    local expected = '(script)alert(1)(/script)'
    assert.are.equal(sanitize_string(input), expected)
  end)

  it('keeps plain comparison angle brackets untouched', function()
    local input = 'foo > bar and 2 < 3'
    assert.are.equal(sanitize_string(input), input)
  end)

  it('removes control characters and null bytes', function()
    local input = 'foo\0bar\1baz\127'
    assert.are.equal(sanitize_string(input), 'foobarbaz')
  end)

  it('keeps tabs and newlines', function()
    local input = 'line1\nline2\tend'
    assert.are.equal(sanitize_string(input), input)
  end)
end)
