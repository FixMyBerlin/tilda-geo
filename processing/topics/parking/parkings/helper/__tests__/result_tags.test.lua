describe('`result_tags`', function()
  local transform_parkings = require('topics.parking.parkings.helper.transform_parkings')
  local result_tags = require('topics.parking.parkings.helper.result_tags')
  local log = require('topics.helper.log')
  local osm2pgsql = require('topics.helper.osm2pgsql')

  it('works', function()
    local input_object = {
      tags = {
        highway = 'residential',
        mapillary = '123',
        ['parking:left'] = 'lane',
      },
      id = 1,
      type = 'way',
    }
    local results = transform_parkings(input_object)

    local left = result_tags(results.left)
    assert.are.equal(left.id, 'way/1/left')
    assert.are.equal(left.tags.side, 'left')
    assert.are.equal(left.tags.parking, 'lane')
    assert.are.equal(left.tags.mapillary, input_object.tags.mapillary)

    local right = result_tags(results.right)
    assert.are.equal(right.id, 'way/1/right')
    assert.are.equal(right.tags.side, 'right')
    assert.are.equal(right.tags.parking, 'missing')
    assert.are.equal(right.tags.mapillary, input_object.tags.mapillary)
  end)

  describe('parking tag', function()
    -- explicit value is tested above

    it('falls back to not_expected for dual_carriage', function()
      local input_object = {
        tags = {
          highway = 'residential',
          dual_carriageway = 'yes',
          ['parking:right'] = 'no',
        },
        id = 1,
        type = 'way',
      }
      local results = transform_parkings(input_object)

      local left = result_tags(results.left)
      assert.are.equal(left.id, 'way/1/left')
      assert.are.equal(left.tags.side, 'left')
      assert.are.equal(left.tags.parking, 'not_expected')

      local right = result_tags(results.right)
      assert.are.equal(right.id, 'way/1/right')
      assert.are.equal(right.tags.side, 'right')
      assert.are.equal(right.tags.parking, 'no')
    end)

    it('falls back to missing for is_road', function()
      local input_object = {
        tags = {
          highway = 'residential',
          ['parking:right'] = 'no',
        },
        id = 1,
        type = 'way',
      }
      local results = transform_parkings(input_object)

      local left = result_tags(results.left)
      assert.are.equal(left.id, 'way/1/left')
      assert.are.equal(left.tags.side, 'left')
      assert.are.equal(left.tags.parking, 'missing')

      local right = result_tags(results.right)
      assert.are.equal(right.id, 'way/1/right')
      assert.are.equal(right.tags.side, 'right')
      assert.are.equal(right.tags.parking, 'no')
    end)
  end)
  describe('replaced tags', function()
    it('reports malformed conditionals with the original parking:* key', function()
      local input_object = {
        tags = {
          highway = 'residential',
          ['parking:both'] = 'lane',
          ['parking:both:restriction:conditional'] = 'no_parking @ (Mo-Fr 09:00-20:00; Sa 09:00-18:00; none @ residents',
        },
        id = 1,
        type = 'way',
      }
      local results = transform_parkings(input_object)

      local left, replaced_tags = result_tags(results.left)
      assert.are.equal('invalid', left.tags.condition_category)
      assert.are.same({
        ['parking:both:restriction:conditional'] = input_object.tags['parking:both:restriction:conditional'],
      }, replaced_tags)
    end)

    it('reports rewritten conditionals separately, with the original parking:* key', function()
      local input_object = {
        tags = {
          highway = 'residential',
          ['parking:both'] = 'lane',
          ['parking:both:restriction:conditional'] = 'no_parking @ (Mo-FR 9:00-20:00)',
        },
        id = 1,
        type = 'way',
      }
      local results = transform_parkings(input_object)

      local left, replaced_tags, rewritten_tags = result_tags(results.left)
      assert.are.equal('no_parking (Mo-Fr 09:00-20:00)', left.tags.condition_category)
      assert.are.same({}, replaced_tags)
      assert.are.same({
        ['parking:both:restriction:conditional'] = input_object.tags['parking:both:restriction:conditional'],
      }, rewritten_tags)
    end)
  end)

  describe('road_width', function()
    it('uses the width of the road, not of the parking lane', function()
      local results = transform_parkings({
        tags = {
          highway = 'residential',
          width = '7.5',
          ['source:width'] = 'ALKIS',
          ['parking:left'] = 'lane',
          ['parking:left:width'] = '2',
        },
        id = 1,
        type = 'way',
      })
      local left = result_tags(results.left)
      assert.are.equal(left.tags.road_width, 7.5)
      assert.are.equal(left.tags.road_width_confidence, 'high')
      assert.are.equal(left.tags.road_width_source, 'ALKIS')
    end)

    it('uses est_width of the road with medium confidence', function()
      local results = transform_parkings({
        tags = { highway = 'residential', est_width = '6', ['parking:left'] = 'lane' },
        id = 1,
        type = 'way',
      })
      local left = result_tags(results.left)
      assert.are.equal(left.tags.road_width, 6)
      assert.are.equal(left.tags.road_width_confidence, 'medium')
      assert.are.equal(left.tags.road_width_source, nil)
    end)

    it('falls back to the default of the road class with low confidence', function()
      local results = transform_parkings({
        tags = { highway = 'secondary', ['parking:left'] = 'lane', ['parking:left:width'] = '2' },
        id = 1,
        type = 'way',
      })
      local left = result_tags(results.left)
      assert.are.equal(left.tags.road_width, 14)
      assert.are.equal(left.tags.road_width_confidence, 'low')
      assert.are.equal(left.tags.road_width_source, 'highway_default')
    end)
  end)
end)
