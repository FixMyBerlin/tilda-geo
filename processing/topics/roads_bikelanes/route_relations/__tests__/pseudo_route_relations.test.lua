describe('pseudo_route_relations', function()
  local pseudo_route_relations = require('topics.roads_bikelanes.route_relations.pseudo_route_relations')

  local tags = {
    _radnetz_berlin = { [''] = 'Vorrangnetz', ['cycleway/left'] = 'Ergänzungsnetz', ['cycleway/right'] = 'Sonstiges' },
  }

  it('uses the class of the way itself for the way', function()
    assert.are.equal('radnetz_berlin:Vorrangnetz', pseudo_route_relations(tags, 'way/4425411'))
  end)

  it('uses the class of each side for the side', function()
    assert.are.equal('radnetz_berlin:Ergänzungsnetz', pseudo_route_relations(tags, 'way/4425411/cycleway/left'))
    assert.are.equal('radnetz_berlin:Sonstiges', pseudo_route_relations(tags, 'way/4425411/cycleway/right'))
  end)

  it('returns nil for a side without its own row', function()
    assert.is_nil(pseudo_route_relations(tags, 'way/4425411/sidewalk/left'))
    assert.is_nil(pseudo_route_relations({ _radnetz_berlin = { ['cycleway/left'] = 'Vorrangnetz' } }, 'way/1'))
  end)

  it('returns nil without pseudo tag data', function()
    assert.is_nil(pseudo_route_relations({}, 'way/1'))
  end)
end)
