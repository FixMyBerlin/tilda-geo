describe('tilda_description', function()
  local DESC = require('topics.helper.tilda_description')
  local merge_table = require('topics.helper.merge_table')

  it('puts hint tokens first and the OSM texts last', function()
    local tags = { description = 'Zufahrt; nur Anlieger', note = 'Kopfsteinpflaster' }
    DESC.add_hint(tags, DESC.token('closed_blocked'))
    assert.are.equal(
      DESC.build(tags, { DESC.token('surface_left', 'asphalt') }),
      'TILDA_closed_blocked;TILDA_surface_left=asphalt;OSM-`description`: Zufahrt; nur Anlieger;OSM-`note`: Kopfsteinpflaster'
    )
  end)

  it('leaves out a `note` that repeats the `description`', function()
    assert.are.equal(
      DESC.build({ description = 'Weg gesperrt.', note = ' weg  Gesperrt ' }),
      'OSM-`description`: Weg gesperrt.'
    )
  end)

  it('keeps a text of only punctuation', function()
    assert.are.equal(DESC.build({ description = '?' }), 'OSM-`description`: ?')
  end)

  it('writes `note` without `description`', function()
    assert.are.equal(DESC.build({ note = 'Pflaster' }), 'OSM-`note`: Pflaster')
  end)

  it('returns nil without hints and OSM texts', function()
    assert.is_nil(DESC.build({}))
  end)

  it('keeps the hints of copied tags apart', function()
    local tags = {}
    DESC.add_hint(tags, 'TILDA_a')
    local copy = merge_table({}, tags)
    DESC.add_hint(copy, 'TILDA_b')
    assert.are.same(DESC.hints(tags), { 'TILDA_a' })
    assert.are.same(DESC.hints(copy), { 'TILDA_a', 'TILDA_b' })
  end)
end)
