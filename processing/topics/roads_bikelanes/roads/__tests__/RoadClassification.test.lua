describe('RoadClassification', function()
  require('init')
  require('osm2pgsql')

  local logged_errors = {}
  -- Mock width_errors before requiring RoadClassification
  package.loaded['width_errors'] = {
    log = function(object, tag_name, invalid_value, error_msg)
      table.insert(logged_errors, {
        object = object,
        tag = tag_name,
        value = invalid_value,
        error = error_msg
      })
    end
  }

  require('RoadClassification')

  before_each(function()
    logged_errors = {}
  end)

  it('uses width with high confidence and handles source:width', function()
    local input_tags = {
      highway = 'residential',
      width = '3.5 m',
      ['source:width'] = 'Handy-Ausmessen'
    }
    local dummy_object = { id = 1, type = 'way' }
    local result = RoadClassification(input_tags, dummy_object)

    assert.are.equal(3.5, result.width)
    assert.are.equal('high', result.width_confidence)
    assert.are.equal('Handy-Ausmessen', result.width_source)
    assert.are.equal(0, #logged_errors)
  end)

  it('falls back to est_width with low confidence', function()
    local input_tags = {
      highway = 'residential',
      est_width = '6m',
      ['source:width'] = 'estimation'
    }
    local dummy_object = { id = 2, type = 'way' }
    local result = RoadClassification(input_tags, dummy_object)

    assert.are.equal(6, result.width)
    assert.are.equal('low', result.width_confidence)
    assert.are.equal('estimation', result.width_source)
    assert.are.equal(0, #logged_errors)
  end)

  it('prefers width over est_width', function()
    local input_tags = {
      highway = 'residential',
      width = '4 m',
      est_width = '6 m'
    }
    local dummy_object = { id = 3, type = 'way' }
    local result = RoadClassification(input_tags, dummy_object)

    assert.are.equal(4, result.width)
    assert.are.equal('high', result.width_confidence)
    assert.are.equal(0, #logged_errors)
  end)

  it('logs error on invalid width and falls back to est_width', function()
    local input_tags = {
      highway = 'residential',
      width = 'fehlerhafter Text',
      est_width = '5'
    }
    local dummy_object = { id = 4, type = 'way' }
    local result = RoadClassification(input_tags, dummy_object)

    assert.are.equal(5, result.width)
    assert.are.equal('low', result.width_confidence)
    assert.are.equal(1, #logged_errors)
    assert.are.equal('width', logged_errors[1].tag)
    assert.are.equal('fehlerhafter Text', logged_errors[1].value)
  end)

  it('logs error on invalid width and invalid est_width', function()
    local input_tags = {
      highway = 'residential',
      width = 'invalid_width',
      est_width = 'invalid_est_width'
    }
    local dummy_object = { id = 5, type = 'way' }
    local result = RoadClassification(input_tags, dummy_object)

    assert.is_nil(result.width)
    assert.is_nil(result.width_confidence)
    assert.are.equal(2, #logged_errors)
    assert.are.equal('width', logged_errors[1].tag)
    assert.are.equal('invalid_width', logged_errors[1].value)
    assert.are.equal('est_width', logged_errors[2].tag)
    assert.are.equal('invalid_est_width', logged_errors[2].value)
  end)
end)
