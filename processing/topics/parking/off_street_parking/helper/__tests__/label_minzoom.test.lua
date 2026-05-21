describe('off_street_parking label minzoom', function()
  local label_minzoom = require('topics.parking.off_street_parking.helper.label_minzoom')

  it('returns 11 for area labels', function()
    assert.are.same(label_minzoom(), 11)
  end)
end)
