describe('side_line_reversed', function()
  local side_line_reversed = require('topics.roads_bikelanes.bikelanes.helper.side_line_reversed')
  local normalize_oneway_tags = require('topics.helper.normalize_oneway_tags')

  ---@param side string
  ---@param lane table
  ---@param road table
  local function lane(side, lane_tags, road)
    local tags = lane_tags or {}
    tags._side = side
    tags._parent = road or {}
    return tags
  end

  it('keeps lines of the road itself in the drawing direction', function()
    assert.is_false(side_line_reversed({ _side = 'self', oneway = '-1' }))
  end)

  describe('road without oneway', function()
    it('runs the right lane with the way and the left lane against it', function()
      assert.is_false(side_line_reversed(lane('right')))
      assert.is_true(side_line_reversed(lane('left')))
    end)

    it('follows a tagged direction', function()
      assert.is_false(side_line_reversed(lane('left', { oneway = 'yes' })))
      assert.is_true(side_line_reversed(lane('right', { oneway = '-1' })))
      assert.is_true(side_line_reversed(lane('right', { ['oneway:bicycle'] = '-1' })))
    end)

    it('keeps the side rule for two-way lanes', function()
      assert.is_true(side_line_reversed(lane('left', { oneway = 'no' })))
      assert.is_false(side_line_reversed(lane('right', { oneway = 'no' })))
    end)
  end)

  describe('oneway road', function()
    it('runs both lanes with the road direction', function()
      local road = { oneway = 'yes' }
      assert.is_false(side_line_reversed(lane('left', {}, road)))
      assert.is_false(side_line_reversed(lane('right', {}, road)))
    end)

    it('runs a left lane with the road also when bicycles may ride against it', function()
      -- Wiki example: a contraflow lane needs `cycleway:left:oneway=-1`.
      local road = { oneway = 'yes', ['oneway:bicycle'] = 'no' }
      assert.is_false(side_line_reversed(lane('left', {}, road)))
      assert.is_true(side_line_reversed(lane('left', { oneway = '-1' }, road)))
    end)

    it('runs both lanes against the way on oneway=-1', function()
      local road = { oneway = '-1' }
      assert.is_true(side_line_reversed(lane('left', {}, road)))
      assert.is_true(side_line_reversed(lane('right', {}, road)))
      assert.is_false(side_line_reversed(lane('right', { oneway = 'yes' }, road)))
    end)

    it('treats a roundabout as a oneway road (after normalize_oneway_tags)', function()
      local road = { junction = 'roundabout' }
      normalize_oneway_tags(road)
      assert.is_false(side_line_reversed(lane('left', {}, road)))
    end)

    it('keeps the side rule for two-way lanes', function()
      assert.is_true(side_line_reversed(lane('left', { oneway = 'no' }, { oneway = 'yes' })))
    end)
  end)
end)
