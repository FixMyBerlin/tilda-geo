describe('entrances result_tags', function()
  require('topics.helper.osm2pgsql')
  local result_tags = require('topics.entrances.helper.result_tags')

  it('keeps the category and the sanitized entrance tags', function()
    local cleaned_tags = result_tags({
      railway = 'subway_entrance',
      entrance = 'yes',
      name = 'U Hermannplatz',
      wheelchair = 'no',
    }, 'public_transport')
    assert.are.same(cleaned_tags, {
      category = 'public_transport',
      entrance = 'yes',
      name = 'U Hermannplatz',
      wheelchair = 'no',
    })
  end)

  it('does not pass through unrelated OSM tags', function()
    local cleaned_tags = result_tags({ entrance = 'main', building = 'yes' }, 'building')
    assert.are.same(cleaned_tags, { category = 'building', entrance = 'main' })
  end)
end)
