describe('lit', function()
  local lit = require('topics.roads_bikelanes.lit.lit')

  it('maps lit=yes', function()
    assert.are.same({ lit = 'yes' }, lit({ lit = 'yes' }))
  end)

  it('maps lit=no', function()
    assert.are.same({ lit = 'no' }, lit({ lit = 'no' }))
  end)

  it('omits lit when tag is missing', function()
    assert.are.same({}, lit({ highway = 'residential' }))
  end)

  it('maps special lighting values to special', function()
    assert.are.same({ lit = 'special' }, lit({ lit = 'automatic' }))
    assert.are.same({ lit = 'special' }, lit({ lit = 'interval' }))
    assert.are.same({ lit = 'special' }, lit({ lit = 'Mo-Fr 18:00-06:00' }))
  end)
end)
