describe('line_direction', function()
  local LINE_DIRECTION = require('topics.roads_bikelanes.helper.line_direction')
  local normalize_oneway_tags = require('topics.helper.normalize_oneway_tags')

  describe('way_reversed', function()
    it('is true on `oneway=-1`', function()
      assert.is_true(LINE_DIRECTION.way_reversed({ oneway = '-1' }))
    end)

    it('is true on `oneway:bicycle=-1`', function()
      assert.is_true(LINE_DIRECTION.way_reversed({ ['oneway:bicycle'] = '-1' }))
    end)

    it('follows the motor vehicle direction on `oneway=-1` with `oneway:bicycle=no`', function()
      assert.is_true(LINE_DIRECTION.way_reversed({ oneway = '-1', ['oneway:bicycle'] = 'no' }))
    end)
  end)

  describe('bikelane_reversed', function()
    ---@param side string
    ---@param lane table
    ---@param road table
    local function lane(side, lane_tags, road)
      local tags = lane_tags or {}
      tags._side = side
      tags._parent = road or {}
      return tags
    end

    it('reverses the row of the way itself like `way_reversed`', function()
      assert.is_true(LINE_DIRECTION.bikelane_reversed({ _side = 'self', oneway = '-1' }))
    end)

    describe('road without oneway', function()
      it('runs the right lane with the way and the left lane against it', function()
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('right')))
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('left')))
      end)

      it('follows a tagged direction', function()
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('left', { oneway = 'yes' })))
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('right', { oneway = '-1' })))
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('right', { ['oneway:bicycle'] = '-1' })))
      end)

      it('keeps the side rule for two-way lanes', function()
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('left', { oneway = 'no' })))
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('right', { oneway = 'no' })))
      end)
    end)

    describe('oneway road', function()
      it('runs both lanes with the road direction', function()
        local road = { oneway = 'yes' }
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('left', {}, road)))
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('right', {}, road)))
      end)

      it('runs a left lane with the road also when bicycles may ride against it', function()
        -- Wiki example: a contraflow lane needs `cycleway:left:oneway=-1`.
        local road = { oneway = 'yes', ['oneway:bicycle'] = 'no' }
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('left', {}, road)))
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('left', { oneway = '-1' }, road)))
      end)

      it('runs both lanes against the way on oneway=-1', function()
        local road = { oneway = '-1' }
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('left', {}, road)))
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('right', {}, road)))
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('right', { oneway = 'yes' }, road)))
      end)

      it('treats a roundabout as a oneway road (after normalize_oneway_tags)', function()
        local road = { junction = 'roundabout' }
        normalize_oneway_tags(road)
        assert.is_false(LINE_DIRECTION.bikelane_reversed(lane('left', {}, road)))
      end)

      it('keeps the side rule for two-way lanes', function()
        assert.is_true(LINE_DIRECTION.bikelane_reversed(lane('left', { oneway = 'no' }, { oneway = 'yes' })))
      end)
    end)
  end)

  describe('swap tags', function()
    it('swaps the forward and backward pairs of a lane', function()
      local swapped = LINE_DIRECTION.swap_lane_tags({
        mapillary_forward = 'photo-with-way',
        mapillary_backward = 'photo-against-way',
        ['traffic_sign:forward'] = 'DE:237',
        ['traffic_sign:backward'] = 'DE:241',
      })

      assert.are.same({
        mapillary_forward = 'photo-against-way',
        mapillary_backward = 'photo-with-way',
        ['traffic_sign:forward'] = 'DE:241',
        ['traffic_sign:backward'] = 'DE:237',
      }, swapped)
    end)

    it('moves a value without its pair to the other key', function()
      local swapped = LINE_DIRECTION.swap_lane_tags({ mapillary_backward = 'photo-against-way' })

      assert.are.same({ mapillary_forward = 'photo-against-way' }, swapped)
    end)

    it('swaps the forward and backward and the left and right pairs of the way itself', function()
      local swapped = LINE_DIRECTION.swap_way_tags({
        ['osm_maxspeed:forward'] = '30',
        ['osm_maxspeed:backward'] = '50',
        bikelane_left = 'cyclewayOnHighway_advisory',
        bikelane_right = 'missing',
        traffic_mode_left = 'parking',
        traffic_mode_right = 'motor_vehicle',
        separation_left = 'kerb',
        separation_right = 'bollard',
        buffer_left = 0.5,
        buffer_right = 0.8,
        marking_left = 'solid_line',
        marking_right = 'dashed_line',
      })

      assert.are.same({
        ['osm_maxspeed:forward'] = '50',
        ['osm_maxspeed:backward'] = '30',
        bikelane_left = 'missing',
        bikelane_right = 'cyclewayOnHighway_advisory',
        traffic_mode_left = 'motor_vehicle',
        traffic_mode_right = 'parking',
        separation_left = 'bollard',
        separation_right = 'kerb',
        buffer_left = 0.8,
        buffer_right = 0.5,
        marking_left = 'dashed_line',
        marking_right = 'solid_line',
      }, swapped)
    end)

    it('returns a new table, so a shared table stays as it is', function()
      local presence = { bikelane_left = 'missing', bikelane_right = 'not_expected' }

      LINE_DIRECTION.swap_way_tags(presence)

      assert.are.same({ bikelane_left = 'missing', bikelane_right = 'not_expected' }, presence)
    end)
  end)

  describe('way_line', function()
    it('reverses geometry and tags of a way with `oneway=-1`', function()
      local reversed_geom = {}
      local object_geom = {}
      function object_geom:reverse()
        return reversed_geom
      end

      local geom, tags = LINE_DIRECTION.way_line({ oneway = '-1' }, object_geom, { bikelane_left = 'missing' })

      assert.are.equal(reversed_geom, geom)
      assert.are.same({ bikelane_right = 'missing' }, tags)
    end)
  end)
end)
