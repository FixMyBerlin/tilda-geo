require('topics.helper.osm2pgsql')

describe('collect_todos', function()
  local collect_todos = require('topics.helper.collect_todos')
  local road_todo_categories = require('topics.roads_bikelanes.roads.road_todo_categories')
  -- local inspect = require('inspect')

  it('Return id, priority, todoTableOnly', function()
    local tags_object = { cycleway = 'shared' }
    local result = collect_todos(road_todo_categories, tags_object, {})
    local expected = {
      [1] = {
        ['id'] = 'deprecated_cycleway_shared',
        ['priority'] = 'prio2',
        ['todoTableOnly'] = false,
      },
    }
    assert.are.same(result, expected)
  end)

  it('Also reports cycleway=shared on a side', function()
    for _, key in ipairs({ 'cycleway:both', 'cycleway:left', 'cycleway:right' }) do
      local result = collect_todos(road_todo_categories, { [key] = 'shared' }, {})
      assert.are.equal(#result, 1, key)
      assert.are.equal(result[1].id, 'deprecated_cycleway_shared', key)
    end
  end)

  it('Does not report other side values', function()
    local result = collect_todos(road_todo_categories, { ['cycleway:right'] = 'shared_lane' }, {})
    assert.are.same(result, {})
  end)

  it('Handle no match', function()
    local result = collect_todos(road_todo_categories, {}, {})
    assert.are.same(result, {})
  end)
end)
