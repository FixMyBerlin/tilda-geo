describe('orient_line_direction_tags', function()
  local orient_line_direction_tags = require('topics.roads_bikelanes.bikelanes.helper.orient_line_direction_tags')

  it('swaps mapillary and traffic_sign direction pairs on the left side', function()
    local tags = {
      mapillary_forward = 'photo-with-way',
      mapillary_backward = 'photo-against-way',
      ['traffic_sign:forward'] = 'DE:237',
      ['traffic_sign:backward'] = 'DE:241',
      mapillary = 'photo-undirected',
      mapillary_traffic_sign = 'sign-photo',
      mapillary_coverage = '2024',
    }

    orient_line_direction_tags(tags, 'left')

    assert.are.equal('photo-against-way', tags.mapillary_forward)
    assert.are.equal('photo-with-way', tags.mapillary_backward)
    assert.are.equal('DE:241', tags['traffic_sign:forward'])
    assert.are.equal('DE:237', tags['traffic_sign:backward'])
    assert.are.equal('photo-undirected', tags.mapillary)
    assert.are.equal('sign-photo', tags.mapillary_traffic_sign)
    assert.are.equal('2024', tags.mapillary_coverage)
  end)

  it('moves a one-sided mapillary value to the other key on the left side', function()
    local tags = { mapillary_backward = 'photo-against-way' }

    orient_line_direction_tags(tags, 'left')

    assert.is_nil(tags.mapillary_backward)
    assert.are.equal('photo-against-way', tags.mapillary_forward)
  end)

  it('leaves right-side and centerline tags in OSM way direction', function()
    local right = {
      mapillary_forward = 'photo-with-way',
      mapillary_backward = 'photo-against-way',
      ['traffic_sign:forward'] = 'DE:237',
    }
    local center = {
      mapillary_forward = 'photo-with-way',
      ['traffic_sign:backward'] = 'DE:241',
    }

    orient_line_direction_tags(right, 'right')
    orient_line_direction_tags(center, 'self')

    assert.are.equal('photo-with-way', right.mapillary_forward)
    assert.are.equal('photo-against-way', right.mapillary_backward)
    assert.are.equal('DE:237', right['traffic_sign:forward'])
    assert.are.equal('photo-with-way', center.mapillary_forward)
    assert.are.equal('DE:241', center['traffic_sign:backward'])
  end)
end)
