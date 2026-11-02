require('topics.helper.osm2pgsql')
local is_unusual_width = require('topics.roads_bikelanes.helper.is_unusual_width')
local parse_width = require('topics.helper.parse_width')
local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
local road_todos = require('topics.roads_bikelanes.roads.road_todo_categories')
local collect_todos = require('topics.helper.collect_todos')
local to_todo_tags = require('topics.helper.to_todo_tags')

describe('is_unusual_width', function()
  local function unusual(object_tags)
    return is_unusual_width(object_tags, { width = parse_width(object_tags.width) })
  end

  for _, width in ipairs({ '0', '-1', 'narrow', '1-2', '0.5;1', '5,7', '3 ft', '50.5', '250' }) do
    it('is true for width=' .. width, function()
      assert.is_true(unusual({ width = width }))
    end)
  end

  for _, width in ipairs({ '3', '2.5 m', '100 cm', '2,5', '50' }) do
    it('is false for width=' .. width, function()
      assert.is_false(unusual({ width = width }))
    end)
  end

  it('is false without width', function()
    assert.is_false(unusual({ highway = 'residential' }))
  end)

  describe('reviewed values', function()
    for _, key in ipairs({ 'check_date', 'check_date:width', 'survey:date', 'survey:date:width', 'survey_date' }) do
      it(key .. ' closes the todo', function()
        assert.is_false(unusual({ width = '250', [key] = '2026-05-01' }))
      end)
    end

    it('accepts a date with month or year only', function()
      assert.is_false(unusual({ width = '250', check_date = '2026-05' }))
      assert.is_false(unusual({ width = '250', check_date = '2026' }))
    end)

    it('check_date of another attribute does not close the todo', function()
      assert.is_true(unusual({ width = '250', ['check_date:surface'] = '2026-05-01' }))
    end)

    it('check_date of the road closes the todo of its lane', function()
      local lane = { width = '250', _parent = { check_date = '2026-05-01' } }
      assert.is_false(unusual(lane))
    end)
  end)

  describe('`unusual_width` todo', function()
    local function road_todo_tags(object_tags)
      return to_todo_tags(collect_todos(road_todos, object_tags, { width = parse_width(object_tags.width) }))
    end

    it('is written for roads', function()
      local todos = road_todo_tags({ highway = 'residential', width = '-1' })
      assert.are.equal(todos.unusual_width, 'prio2')
    end)

    it('has priority 1 with mapillary coverage', function()
      local todos = road_todo_tags({ highway = 'residential', width = '250', mapillary_coverage = 'regular' })
      assert.are.equal(todos.unusual_width, 'prio1')
    end)

    it('is table-only', function()
      local todos = collect_todos(road_todos, { highway = 'residential', width = '250' }, {})
      assert.is_true(todos[1].todoTableOnly)
    end)

    it('is written for a separate cycleway', function()
      local tags = { highway = 'cycleway', width = '0', _id = 1, _type = 'way', _length = 100 }
      local result = bikelanes(tags, { tags = tags, id = 1, type = 'way' })
      assert.are.equal(result[1]._todo_list.unusual_width, 'prio2')
      assert.is_nil(result[1].width)
    end)

    it('reads the width of the lane, not of the road', function()
      local tags = {
        highway = 'residential',
        width = '6',
        ['cycleway:right'] = 'lane',
        ['cycleway:right:width'] = 'narrow',
        _id = 2,
        _type = 'way',
        _length = 100,
      }
      local result = bikelanes(tags, { tags = tags, id = 2, type = 'way' })
      local found = false
      for _, row in ipairs(result) do
        if row._side == 'right' then
          found = true
          assert.are.equal(row._todo_list.unusual_width, 'prio2')
        end
      end
      assert.is_true(found)
    end)
  end)
end)
