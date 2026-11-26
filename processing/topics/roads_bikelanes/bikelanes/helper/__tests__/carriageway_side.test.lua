describe('carriageway_side', function()
  local carriageway_side = require('topics.roads_bikelanes.bikelanes.helper.carriageway_side')

  ---@param side string
  ---@param lane_tags table|nil
  ---@param road table|nil
  local function lane(side, lane_tags, road)
    local tags = lane_tags or {}
    tags._side = side
    tags._parent = road or {}
    return tags
  end

  ---@param tags table
  local function sides(tags)
    return { carriageway_side(tags) }
  end

  -- The riding direction of the lines comes from `LINE_DIRECTION.bikelane_reversed` (tested there).
  -- These cases cover each combination of side and line direction.
  describe('lanes on the road', function()
    it('left lane against the way (two-way road): carriageway left', function()
      -- Hermannstraße w998258847: `cycleway:left:separation:left` protects against the carriageway.
      assert.are.same({ 'left', 'right' }, sides(lane('left')))
    end)

    it('right lane with the way (two-way road): carriageway left', function()
      assert.are.same({ 'left', 'right' }, sides(lane('right')))
    end)

    it('left lane with the way (oneway=yes): carriageway right', function()
      assert.are.same({ 'right', 'left' }, sides(lane('left', {}, { oneway = 'yes' })))
    end)

    it('right lane against the way (oneway=-1): carriageway right', function()
      assert.are.same({ 'right', 'left' }, sides(lane('right', {}, { oneway = '-1' })))
    end)

    it('contraflow cycleway:left:oneway=-1 on oneway=yes: carriageway left', function()
      local road = { oneway = 'yes', ['oneway:bicycle'] = 'no' }
      assert.are.same({ 'left', 'right' }, sides(lane('left', { oneway = '-1' }, road)))
    end)
  end)

  describe('separately mapped ways (`_side=self`)', function()
    it('keeps the carriageway left of the way', function()
      assert.are.same({ 'left', 'right' }, sides({ _side = 'self', highway = 'cycleway', oneway = 'yes' }))
      assert.are.same({ 'left', 'right' }, sides({ _side = 'self', highway = 'cycleway' }))
    end)

    it('puts the carriageway right of the way when it is ridden against it', function()
      assert.are.same({ 'right', 'left' }, sides({ _side = 'self', highway = 'cycleway', oneway = '-1' }))
      assert.are.same({ 'right', 'left' }, sides({ _side = 'self', highway = 'path', ['oneway:bicycle'] = '-1' }))
    end)
  end)
end)
