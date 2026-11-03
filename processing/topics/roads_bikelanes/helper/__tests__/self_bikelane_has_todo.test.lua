local self_bikelane_has_todo = require('topics.roads_bikelanes.helper.self_bikelane_has_todo')

describe('self_bikelane_has_todo', function()
  it('is true when the self row has the todo', function()
    local cycleways = { { _side = 'self', _todo_list = { unusual_width = 'prio2' } } }
    assert.is_true(self_bikelane_has_todo(cycleways, 'unusual_width'))
  end)

  it('is false when the self row has other todos', function()
    local cycleways = { { _side = 'self', _todo_list = { missing_width = 'prio3' } } }
    assert.is_false(self_bikelane_has_todo(cycleways, 'unusual_width'))
  end)

  it('is false when only a lane has the todo', function()
    local cycleways = { { _side = 'right', _todo_list = { unusual_width = 'prio2' } } }
    assert.is_false(self_bikelane_has_todo(cycleways, 'unusual_width'))
  end)

  it('is false for a self row without infrastructure, which has no todo list', function()
    assert.is_false(self_bikelane_has_todo({ { _side = 'self' } }, 'unusual_width'))
  end)

  it('is false without rows', function()
    assert.is_false(self_bikelane_has_todo({}, 'unusual_width'))
  end)
end)
