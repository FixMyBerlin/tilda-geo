describe('`categorize_line`', function()
  local categorize_line = require('topics.parking.obstacles.line.categorize_line')
  local log = require('topics.helper.log')
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local result_tags = require('topics.parking.obstacles.helper.result_tags')

  it('obstacle:parking=yes with no matching category returns other fallback', function()
    local object = {
      id = 1, type = 'way',
      tags = { ['obstacle:parking'] = 'yes', ['barrier'] = 'unknown_type' },
    }
    local result = categorize_line(object)
    assert.are.equal('other', result.category.id)
    assert.are.equal('table', type(result.object))
    local row_data = result_tags(result)
    assert.are.equal('way/1', row_data.id)
    assert.are.equal('other', row_data.tags.category)
  end)
end)
