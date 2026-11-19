require('topics.helper.osm2pgsql')

local rows = {}
local function fake_table(name)
  return {
    insert = function(_, row)
      table.insert(rows[name], row)
    end,
  }
end
package.loaded['topics.roads_bikelanes.roads_bikelanes_tables'] = {
  bikelanes_table = fake_table('bikelanes'),
  bikelanes_presence_table = fake_table('bikelanes_presence'),
  todo_lines_table = fake_table('todos_lines'),
}

local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')
local roads_bikelanes_bikelanes = require('topics.roads_bikelanes.roads_bikelanes_bikelanes')

describe('roads_bikelanes_bikelanes `oneway=-1`', function()
  ---@param object_tags table
  ---@param cycleway_presence table|nil
  local function run(object_tags, cycleway_presence)
    rows.bikelanes, rows.bikelanes_presence, rows.todos_lines = {}, {}, {}
    object_tags._type = 'way'
    object_tags._id = 42
    object_tags._length = 100
    local reversed_geom = { reversed = true }
    local object_geom = {}
    function object_geom:reverse()
      return reversed_geom
    end
    roads_bikelanes_bikelanes({
      object_meta = {},
      object_tags = object_tags,
      object_geom = object_geom,
      shared_result_tags = result_tags(object_tags),
      cycleways = bikelanes(object_tags, object_geom),
      cycleway_presence = cycleway_presence,
    })
    return reversed_geom
  end

  it('reverses a cycleway and publishes `oneway=yes`', function()
    local reversed_geom = run({ highway = 'cycleway', oneway = '-1' })
    assert.are.equal(rows.bikelanes[1].geom, reversed_geom)
    assert.are.equal(rows.bikelanes[1].tags.oneway, 'yes')
  end)

  it('reverses a path on `oneway:bicycle=-1`', function()
    local reversed_geom = run({ highway = 'path', bicycle = 'designated', ['oneway:bicycle'] = '-1' })
    assert.are.equal(rows.bikelanes[1].geom, reversed_geom)
    assert.are.equal(rows.bikelanes[1].tags.oneway, 'yes')
  end)

  it('reverses a Fahrradstraße with `oneway=-1` and two-way cycling', function()
    local reversed_geom = run({
      highway = 'residential', bicycle_road = 'yes', traffic_sign = 'DE:244.1',
      oneway = '-1', ['oneway:bicycle'] = 'no',
    })
    assert.are.equal(rows.bikelanes[1].geom, reversed_geom)
    assert.are.equal(rows.bikelanes[1].tags.oneway, 'car_not_bike')
  end)

  it('swaps the left and right fields of the reversed cycleway', function()
    run({
      highway = 'cycleway', oneway = '-1',
      ['traffic_mode:left'] = 'motor_vehicle',
      ['separation:left'] = 'kerb', ['separation:right'] = 'no',
      ['buffer:left'] = '0.5',
    })
    local tags = rows.bikelanes[1].tags
    assert.are.equal(tags.traffic_mode_right, 'motor_vehicle')
    assert.is_nil(tags.traffic_mode_left)
    assert.are.equal(tags.separation_right, 'kerb')
    assert.are.equal(tags.separation_left, 'no')
    assert.are.equal(tags.buffer_right, 0.5)
    assert.is_nil(tags.buffer_left)
  end)

  it('swaps right and left in the surface hints of a reversed shared path', function()
    run({ highway = 'path', bicycle = 'designated', foot = 'designated', segregated = 'no', ['oneway:bicycle'] = '-1', surface = 'paving_stones', ['surface:left'] = 'asphalt' })
    assert.are.equal(rows.bikelanes[1].tags.description, 'TILDA_surface_right=asphalt')
  end)

  it('reverses the presence line of the road and swaps its sides', function()
    local reversed_geom = run(
      { highway = 'residential', oneway = '-1' },
      { bikelane_left = 'cyclewayOnHighway_advisory', bikelane_right = 'missing', bikelane_self = 'not_expected' }
    )
    local presence = rows.bikelanes_presence[1]
    assert.are.equal(presence.geom, reversed_geom)
    assert.are.equal(presence.tags.bikelane_left, 'missing')
    assert.are.equal(presence.tags.bikelane_right, 'cyclewayOnHighway_advisory')
  end)
end)
