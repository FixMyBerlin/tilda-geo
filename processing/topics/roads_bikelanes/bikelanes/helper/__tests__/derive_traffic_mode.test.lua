describe('derive_traffic_mode', function()
  local log = require('topics.helper.log')
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local derive_traffic_mode = require('topics.roads_bikelanes.bikelanes.helper.derive_traffic_mode')

  describe('explicit traffic_mode handling', function()
    it('returns explicit traffic_mode when present (right side)', function()
      local bikelaneTags = { ['traffic_mode:right'] = 'motor_vehicle' }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory')
      assert.are.same(result, { traffic_mode_right = 'motor_vehicle' })
    end)

    it('returns explicit traffic_mode when present (left side)', function()
      local bikelaneTags = { ['traffic_mode:left'] = 'motor_vehicle' }
      local centerlineTags = { ['parking:left'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle' })
    end)

    it('returns explicit traffic_mode when present on both sides', function()
      local bikelaneTags = { ['traffic_mode:left'] = 'motor_vehicle', ['traffic_mode:right'] = 'parking' }
      local centerlineTags = {}
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle', traffic_mode_right = 'parking' })
    end)

    it('returns explicit traffic_mode when present on both (*:both) sides', function()
      local bikelaneTags = { ['traffic_mode:both'] = 'motor_vehicle' }
      local centerlineTags = {}
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle', traffic_mode_right = 'motor_vehicle' })
    end)

    it('never infers from parking when any explicit traffic_mode exists', function()
      local bikelaneTags = { ['traffic_mode:left'] = 'motor_vehicle' }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, { traffic_mode_left = 'motor_vehicle' })
    end)

    it('falls back to parking inference when explicit traffic_mode is disallowed', function()
      local bikelaneTags = { ['traffic_mode:right'] = 'totally_invalid_value' }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)
  end)

  describe('parking inference for bicycleRoad', function()
    it('infers parking from both sides for bicycleRoad', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:left'] = 'street_side', ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, { traffic_mode_left = 'parking', traffic_mode_right = 'parking' })
    end)

    it('handles parking:both for bicycleRoad', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:both'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, { traffic_mode_left = 'parking', traffic_mode_right = 'parking' })
    end)

    it('returns nil when no parking for bicycleRoad', function()
      local bikelaneTags = {}
      local centerlineTags = {}
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, {})
    end)
  end)

  describe('directional parking inference for cycleway lanes', function()
    it('infers only right side for right-side cycleway lane', function()
      local bikelaneTags = { _side = 'right', _parent = {} }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)

    it('infers only right side for right-side cycleway lane - ignore the other side', function()
      local bikelaneTags = { _side = 'right', _parent = {} }
      local centerlineTags = { ['parking:left'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive')
      assert.are.same(result, {})
    end)

    it('infers the right (kerb) side for a left lane on a two-way road', function()
      local bikelaneTags = { _side = 'left', _parent = {} }
      local centerlineTags = { ['parking:left'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)

    it('infers the left side when the carriageway is right of the lane (left lane on oneway=yes)', function()
      local bikelaneTags = { _side = 'left', _parent = { oneway = 'yes' } }
      local centerlineTags = { oneway = 'yes', ['parking:left'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_advisory')
      assert.are.same(result, { traffic_mode_left = 'parking' })
    end)

    it('infers the left side when the carriageway is right of the lane (right lane on oneway=-1)', function()
      local bikelaneTags = { _side = 'right', _parent = { oneway = '-1' } }
      local centerlineTags = { oneway = '-1', ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive')
      assert.are.same(result, { traffic_mode_left = 'parking' })
    end)

    it('infers the right side for a contraflow lane (carriageway left)', function()
      local road = { oneway = 'yes', ['oneway:bicycle'] = 'no' }
      local bikelaneTags = { _side = 'left', _parent = road, oneway = '-1' }
      local centerlineTags = { oneway = 'yes', ['oneway:bicycle'] = 'no', ['parking:left'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)

    it('ignores opposite side parking for directional lanes', function()
      local bikelaneTags = { _side = 'right', _parent = {} }
      local centerlineTags = { ['parking:left'] = 'street_side', ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighway_exclusive')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)
  end)

  describe('directional parking inference for separately mapped ways', function()
    it('infers the right side of a way drawn in riding direction', function()
      local bikelaneTags = { _side = 'self', highway = 'cycleway' }
      local centerlineTags = { ['parking:both'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighwayProtected')
      assert.are.same(result, { traffic_mode_right = 'parking' })
    end)

    it('infers the left side of the way on oneway=-1 (right of the riding direction)', function()
      local bikelaneTags = { _side = 'self', highway = 'cycleway', oneway = '-1' }
      local centerlineTags = { ['parking:both'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'cyclewayOnHighwayProtected')
      assert.are.same(result, { traffic_mode_left = 'parking' })
    end)
  end)

  describe('category handling', function()
    it('does not infer parking for non-supported categories', function()
      local bikelaneTags = { _side = 'right', _parent = {} }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'separateCycleway')
      assert.are.same(result, {})
    end)

    it('handles nil categoryId', function()
      local bikelaneTags = { _side = 'right', _parent = {} }
      local centerlineTags = { ['parking:right'] = 'street_side' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, nil)
      assert.are.same(result, {})
    end)
  end)

  describe('parking value handling', function()
    it('does not infer when parking is no', function()
      local bikelaneTags = {}
      local centerlineTags = { ['parking:right'] = 'no' }
      local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
      assert.are.same(result, {})
    end)

    it('handles various parking types', function()
      local parking_values = { 'lane', 'street_side', 'on_kerb' }
      for _, parking_type in ipairs(parking_values) do
        local bikelaneTags = {}
        local centerlineTags = { ['parking:right'] = parking_type }
        local result = derive_traffic_mode(bikelaneTags, centerlineTags, 'bicycleRoad')
        assert.are.same(result, { traffic_mode_right = 'parking' })
      end
    end)
  end)
end)
