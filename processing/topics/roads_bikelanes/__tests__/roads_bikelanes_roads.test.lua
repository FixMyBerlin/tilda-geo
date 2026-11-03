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
  roads_table = fake_table('roads'),
  roads_path_classes_table = fake_table('roadsPathClasses'),
  bike_suitability_table = fake_table('bikeSuitability'),
  todo_lines_table = fake_table('todos_lines'),
}

local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')
local roads_bikelanes_roads = require('topics.roads_bikelanes.roads_bikelanes_roads')

describe('roads_bikelanes_roads', function()
  ---@param object_tags table
  ---@return table[] cycleways
  local function run(object_tags)
    rows.roads, rows.roadsPathClasses, rows.bikeSuitability, rows.todos_lines = {}, {}, {}, {}
    object_tags._type = 'way'
    object_tags._id = 42
    object_tags._length = 100
    local object_geom = {}
    local cycleways = bikelanes(object_tags, object_geom)
    roads_bikelanes_roads({
      object_meta = {},
      object_tags = object_tags,
      object_geom = object_geom,
      shared_result_tags = result_tags(object_tags),
      cycleways = cycleways,
    })
    return cycleways
  end

  local function self_row(cycleways)
    for _, cycleway in ipairs(cycleways) do
      if cycleway._side == 'self' then return cycleway end
    end
    error('no self row')
  end

  describe('`unusual_width` todo', function()
    it('is left to bikelanes when the self row has it', function()
      local cycleways = run({ highway = 'cycleway', width = '0' })
      assert.are.equal(self_row(cycleways)._todo_list.unusual_width, 'prio2')
      assert.are.equal(#rows.todos_lines, 0)
    end)

    it('stays on the path when the self row reads another width', function()
      local cycleways = run({ highway = 'path', bicycle = 'designated', width = 'narrow', ['cycleway:width'] = '2' })
      assert.is_nil(self_row(cycleways)._todo_list.unusual_width)
      assert.are.equal(rows.todos_lines[1].tags.unusual_width, 'prio2')
    end)

    it('stays on a road next to lanes', function()
      run({ highway = 'residential', width = '0', ['cycleway:right'] = 'lane', ['cycleway:right:width'] = '1.5' })
      assert.are.equal(rows.todos_lines[1].tags.unusual_width, 'prio2')
    end)
  end)

  it('publishes no internal todo state', function()
    run({ highway = 'cycleway', width = '0', bicycle = 'designated' })
    run({ highway = 'residential', width = '0' })
    for _, name in ipairs({ 'roads', 'roadsPathClasses', 'bikeSuitability' }) do
      for _, row in ipairs(rows[name]) do
        assert.is_nil(row.tags._self_bikelane_has_unusual_width, name)
        assert.is_nil(row.tags._todo_list, name)
      end
    end
  end)
end)
