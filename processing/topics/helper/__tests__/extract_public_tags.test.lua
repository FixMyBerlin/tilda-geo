local extract_public_tags = require('topics.helper.extract_public_tags')

describe('extract_public_tags', function()
  it('keeps public tags and drops tags starting with `_`', function()
    local result = extract_public_tags({ name = 'Foo', width = 2, _todo_list = {}, _internal = false })
    assert.are.same(result, { name = 'Foo', width = 2 })
  end)

  it('keeps `_` inside of a key', function()
    assert.are.same(extract_public_tags({ surface_source = 'tag' }), { surface_source = 'tag' })
  end)

  it('does not change the input', function()
    local tags = { name = 'Foo', _internal = true }
    extract_public_tags(tags)
    assert.are.same(tags, { name = 'Foo', _internal = true })
  end)
end)
