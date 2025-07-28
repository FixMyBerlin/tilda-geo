describe('deriveTrafficMode', function()
  require('init')
  require('Log')
  require('osm2pgsql')
  local deriveTrafficMode = require('deriveTrafficMode')

  describe('explicit traffic_mode handling', function()
    it('returns explicit traffic_mode when present (right side)', function()
      local bikelaneTags = { ['traffic_mode:right'] = 'motor_vehicle' }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory', 'right')
      assert.are.same(result, { traffic_mode_right = 'motor_vehicle' })
    end)

    it('returns explicit traffic_mode when present (left side)', function()
      local bikelaneTags = { ['traffic_mode:left'] = 'motor_vehicle' }
      local centerlineTags = { ['parking:left'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory', 'left')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle' })
    end)

    it('returns explicit traffic_mode when present on both sides', function()
      local bikelaneTags = { ['traffic_mode:left'] = 'motor_vehicle', ['traffic_mode:right'] = 'parking' }
      local centerlineTags = {}
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle', traffic_mode_right = 'parking' })
    end)

    it('returns explicit traffic_mode when present on both (*:both) sides', function()
      local bikelaneTags = { ['traffic_mode:both'] = 'motor_vehicle' }
      local centerlineTags = {}
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle', traffic_mode_right = 'motor_vehicle' })
    end)

    it('never infers from parking when any explicit traffic_mode exists', function()
      local bikelaneTags = { ['traffic_mode:left'] = 'motor_vehicle' }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle' })
    end)
  end)

  describe('parking inference for bicycleRoad', function()
    it('infers parking from both sides for bicycleRoad', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:left'] = 'street_side', ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, { traffic_mode_left = 'parking', traffic_mode_right = 'parking' })
    end)

    it('handles parking:both for bicycleRoad', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:both'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, { traffic_mode_left = 'parking', traffic_mode_right = 'parking' })
    end)

    it('returns nil when no parking for bicycleRoad', function()
      local bikelaneTags = {}
      local centerlineTags = {}
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, {})
    end)
  end)

  describe('directional parking inference for cycleway lanes', function()
    it('infers only right side for right-side cycleway lane', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive', 'right')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)

    it('infers only right side for right-side cycleway lane - ignore the other side', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:left'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive', 'right')
      assert.are.same(result, {})
    end)

    it('infers only left side for left-side cycleway lane', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:left'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory', 'left')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)

    it('ignores opposite side parking for directional lanes', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:left'] = 'street_side', ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive', 'right')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)
  end)

  describe('category handling', function()
    it('does not infer parking for non-supported categories', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'separateCycleway', 'right')
      assert.are.same(result, {})
    end)

    it('handles nil categoryId', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, nil, 'right')
      assert.are.same(result, {})
    end)
  end)

  describe('parking value handling', function()
    it('does not infer when parking is "no"', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:right'] = 'no' }
      local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
      assert.are.same(result, {})
    end)

    it('handles various parking types', function()
      local parking_values = { 'lane', 'street_side', 'on_kerb' }
      for _, parking_type in ipairs(parking_values) do
        local bikelaneTags = {}
        local centerlineTags = { ['parking:right'] = parking_type }
        local result = deriveTrafficMode(bikelaneTags, centerlineTags, 'bicycleRoad', 'self')
        assert.are.same(result, { traffic_mode_right = 'parking' })
      end
    end)
  end)
end)
