require('topics.helper.osm2pgsql')
local is_adjoining_of_vs_csv = require('topics.roads_bikelanes.pseudo_tags_sidepath.is_adjoining_of_vs_csv')
local road_todos = require('topics.roads_bikelanes.roads.road_todo_categories')
local bikelane_todos = require('topics.roads_bikelanes.bikelanes.bikelane_todo_categories')
local collect_todos = require('topics.helper.collect_todos')
local to_todo_tags = require('topics.helper.to_todo_tags')

describe('is_adjoining_of_vs_csv', function()
  local disagreement = {
    _side = 'self',
    ['is_sidepath:of'] = 'primary',
    _sidepath_adjoining_road = 'residential',
  }

  it('records a non-crossing disagreement and keeps the published value as :of', function()
    assert.is_true(is_adjoining_of_vs_csv(disagreement))
  end)

  it('records residential versus residential_priority_road (no CSV enrich)', function()
    assert.is_true(is_adjoining_of_vs_csv({
      ['is_sidepath:of'] = 'residential',
      _sidepath_adjoining_road = 'residential_priority_road',
    }))
  end)

  it('is silent when both sources agree', function()
    assert.is_false(is_adjoining_of_vs_csv({
      ['is_sidepath:of'] = 'secondary',
      _sidepath_adjoining_road = 'secondary',
    }))
  end)

  it('is silent with only one source', function()
    assert.is_false(is_adjoining_of_vs_csv({ ['is_sidepath:of'] = 'secondary' }))
    assert.is_false(is_adjoining_of_vs_csv({ _sidepath_adjoining_road = 'secondary' }))
  end)

  it('is silent on crossings (parallel :of versus crossed CSV is expected)', function()
    assert.is_false(is_adjoining_of_vs_csv({
      highway = 'footway',
      footway = 'crossing',
      ['is_sidepath:of'] = 'residential',
      _sidepath_adjoining_road = 'secondary',
    }))
  end)

  it('is silent on virtual sides and on Fahrradstraße', function()
    assert.is_false(is_adjoining_of_vs_csv({
      _side = 'left',
      ['is_sidepath:of'] = 'primary',
      _sidepath_adjoining_road = 'residential',
    }))
    assert.is_false(is_adjoining_of_vs_csv({
      bicycle_road = 'yes',
      ['is_sidepath:of'] = 'primary',
      _sidepath_adjoining_road = 'residential',
    }))
  end)

  describe('`adjoining_of_vs_csv` todo', function()
    for name, todos in pairs({ roads = road_todos, bikelanes = bikelane_todos }) do
      it('is table-only with priority 2 in ' .. name, function()
        local collected = collect_todos(todos, disagreement, {})
        assert.are.equal(to_todo_tags(collected).adjoining_of_vs_csv, 'prio2')
        for _, todo in ipairs(collected) do
          if todo.id == 'adjoining_of_vs_csv' then
            assert.is_true(todo.todoTableOnly)
          end
        end
      end)
    end
  end)
end)
