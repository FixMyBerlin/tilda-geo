require('topics.helper.osm2pgsql')
local adjoining_of_vs_csv_todo = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_of_vs_csv_todo')

local todo = adjoining_of_vs_csv_todo.todo

describe('adjoining_of_vs_csv_todo', function()
  it('records a non-crossing disagreement and keeps the published value as :of', function()
    local result = todo(
      {
        _side = 'self',
        ['is_sidepath:of'] = 'primary',
        _sidepath_adjoining_road = 'residential',
      },
      {}
    )
    assert.are.equal('adjoining_of_vs_csv', result.id)
    assert.are.equal('2', result.priority)
    assert.is_true(result.todoTableOnly)
  end)

  it('records residential versus residential_priority_road (no CSV enrich)', function()
    local result = todo({
      ['is_sidepath:of'] = 'residential',
      _sidepath_adjoining_road = 'residential_priority_road',
    }, {})
    assert.are.equal('adjoining_of_vs_csv', result.id)
  end)

  it('is silent when both sources agree', function()
    assert.is_nil(todo({
      ['is_sidepath:of'] = 'secondary',
      _sidepath_adjoining_road = 'secondary',
    }, {}))
  end)

  it('is silent on crossings (parallel :of versus crossed CSV is expected)', function()
    assert.is_nil(todo({
      highway = 'footway',
      footway = 'crossing',
      ['is_sidepath:of'] = 'residential',
      _sidepath_adjoining_road = 'secondary',
    }, {}))
  end)

  it('is silent on virtual sides and on Fahrradstraße', function()
    assert.is_nil(todo({
      _side = 'left',
      ['is_sidepath:of'] = 'primary',
      _sidepath_adjoining_road = 'residential',
    }, {}))
    assert.is_nil(todo({
      bicycle_road = 'yes',
      ['is_sidepath:of'] = 'primary',
      _sidepath_adjoining_road = 'residential',
    }, {}))
  end)
end)
