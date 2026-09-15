describe('off_street_parking label minzoom', function()
  local label_minzoom = require('topics.parking.off_street_parking.helper.label_minzoom')

  it('does not show labels before z11', function()
    assert.are.same(label_minzoom(10000), 11)
  end)

  it('follows area minzoom from z11', function()
    assert.are.same(label_minzoom(2500), 11)
    assert.are.same(label_minzoom(199), 14)
  end)
end)
