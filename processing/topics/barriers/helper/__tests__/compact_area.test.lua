describe('barriers compact_area', function()
  local compact_area = require('topics.barriers.helper.compact_area')

  it('treats large area-only water as compact', function()
    assert.is_true(compact_area.is_compact_water(200000, nil))
  end)

  it('treats round water bodies as compact', function()
    assert.is_true(compact_area.is_compact_water(100000, 1000))
  end)

  it('rejects elongated water bodies with large perimeter', function()
    assert.is_false(compact_area.is_compact_water(100000, 100000))
  end)

  it('rejects water below the z8 area threshold', function()
    assert.is_false(compact_area.is_compact_water(50000, 500))
  end)
end)
