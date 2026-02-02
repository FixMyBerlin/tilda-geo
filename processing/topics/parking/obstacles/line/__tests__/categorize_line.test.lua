describe('`categorize_line`', function()
  require('init')
  require('categorize_line')
  require('Log')
  require('osm2pgsql')
  local result_tags_obstacles = require('result_tags_obstacles')

  it('obstacle:parking=yes with no matching category returns other fallback', function()
    local object = {
      id = 1, type = 'way',
      tags = { ['obstacle:parking'] = 'yes', ['barrier'] = 'unknown_type' },
    }
    local result = categorize_line(object)
    assert.are.equal('other', result.category.id)
    assert.are.equal('table', type(result.object))
    local row_data = result_tags_obstacles(result)
    assert.are.equal('way/1', row_data.id)
    assert.are.equal('other', row_data.tags.category)
  end)
end)
