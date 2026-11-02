describe('route_relation_members', function()
  require('topics.helper.osm2pgsql')
  local route_relation_members = require('topics.roads_bikelanes.route_relations.route_relation_members')

  local function relation(tags, members)
    return { id = 1, tags = tags, members = members }
  end

  it('returns one row per member way of a processed route type', function()
    local rows = route_relation_members(relation(
      { type = 'route', route = 'bus' },
      {
        { type = 'w', ref = 10, role = '' },
        { type = 'n', ref = 99, role = 'stop' },
        { type = 'w', ref = 11, role = '' },
      }
    ))
    assert.are.same({ { way_id = 10, route = 'bus' }, { way_id = 11, route = 'bus' } }, rows)
  end)

  it('skips platform members of public transport routes', function()
    local rows = route_relation_members(relation(
      { type = 'route', route = 'bus' },
      {
        { type = 'w', ref = 10, role = '' },
        { type = 'w', ref = 20, role = 'platform' },
        { type = 'w', ref = 21, role = 'platform_entry_only' },
        { type = 'w', ref = 22, role = 'platform_exit_only' },
      }
    ))
    assert.are.same({ { way_id = 10, route = 'bus' } }, rows)
  end)

  it('lists a way once when it is a member twice', function()
    local rows = route_relation_members(relation(
      { type = 'route', route = 'bicycle' },
      { { type = 'w', ref = 10, role = 'forward' }, { type = 'w', ref = 10, role = 'backward' } }
    ))
    assert.are.same({ { way_id = 10, route = 'bicycle' } }, rows)
  end)

  it('keeps foot and hiking apart', function()
    local member = { { type = 'w', ref = 10, role = '' } }
    assert.are.same('foot', route_relation_members(relation({ type = 'route', route = 'foot' }, member))[1].route)
    assert.are.same('hiking', route_relation_members(relation({ type = 'route', route = 'hiking' }, member))[1].route)
  end)

  it('ignores other route types and other relations', function()
    local member = { { type = 'w', ref = 10, role = '' } }
    assert.are.same({}, route_relation_members(relation({ type = 'route', route = 'horse' }, member)))
    assert.are.same({}, route_relation_members(relation({ type = 'route_master', route = 'bus' }, member)))
    assert.are.same({}, route_relation_members(relation({ type = 'multipolygon' }, member)))
  end)
end)
