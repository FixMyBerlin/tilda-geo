require('topics.helper.osm2pgsql')

local ACCESS = require('topics.roads_bikelanes.helper.access_restriction')
local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')

local access_restriction = ACCESS.access_restriction

---@param tags table
---@return table
local function copy_tags(tags)
  local copy = {}
  for k, v in pairs(tags) do copy[k] = v end
  return copy
end

---@param tags table
---@return table[] cycleways
local function categorize(tags)
  tags._type = 'way'
  tags._id = 1
  tags._length = 50
  return bikelanes(tags)
end

---@param cycleways table[]
---@param side string
---@return string|nil
local function category_of(cycleways, side)
  for _, cycleway in ipairs(cycleways) do
    if cycleway._side == side and cycleway._infrastructureExists then return cycleway.category end
  end
  return nil
end

describe('access_restriction', function()
  describe('public ways', function()
    it('returns nil without access tags', function()
      assert.is_nil(access_restriction({ highway = 'residential' }))
      assert.is_nil(access_restriction({ highway = 'service', service = 'alley' }))
      assert.is_nil(access_restriction({ highway = 'service' }))
    end)

    it('returns nil when cycling is allowed explicitly', function()
      assert.is_nil(access_restriction({ highway = 'residential', bicycle = 'use_sidepath' }))
      assert.is_nil(access_restriction({ highway = 'residential', vehicle = 'no', bicycle = 'yes' }))
    end)

    it('lets explicit bicycle permission win over access=destination (way/6194793 Radieschenpfad)', function()
      assert.is_nil(access_restriction({ highway = 'path', access = 'destination', bicycle = 'yes' }))
      assert.is_nil(access_restriction({ highway = 'residential', access = 'customers', vehicle = 'yes' }))
      assert.is_nil(access_restriction({ highway = 'footway', foot = 'destination', bicycle = 'permissive' }))
    end)

    it('does not apply temporary closures: lifecycle derivation removes the tag', function()
      local tags = { highway = 'residential', access = 'no', description = 'Weg gesperrt aufgrund einer Baustelle' }
      transform_lifecycle_tags(tags)
      assert.is_false(EXIT.exit_processing(tags))
      assert.is_nil(access_restriction(tags))
    end)

    it('leaves access=no to exit_processing', function()
      assert.is_true(EXIT.exit_processing({ highway = 'residential', access = 'no' }))
    end)
  end)

  describe('bicycle access that does not allow cycling', function()
    it('is no restriction: the edge stays on the graph with access_bicycle', function()
      assert.is_nil(access_restriction({ highway = 'primary', bicycle = 'no' })) -- Heerstraße
      assert.is_nil(access_restriction({ highway = 'service', vehicle = 'destination' })) -- Maronensperlingweg
      assert.is_nil(access_restriction({ highway = 'residential', vehicle = 'destination' }))
      assert.is_nil(access_restriction({ highway = 'residential', vehicle = 'private' }))
      assert.is_nil(access_restriction({ highway = 'residential', vehicle = 'no' }))
      assert.is_nil(access_restriction({ highway = 'footway', bicycle = 'destination' }))
    end)
  end)

  describe('level `roads`', function()
    it('access=destination and customers without bicycle permission', function()
      local restriction = access_restriction({ highway = 'residential', access = 'destination' })
      assert.are.same({ level = 'roads', reason = 'access=destination', may_have_bike_infra = false }, restriction)
      assert.are.equal('access=customers', access_restriction({ highway = 'path', access = 'customers' }).reason)
    end)

    it('foot on footway and bicycle on cycleway, like the other access tags', function()
      assert.are.equal('foot=customers', access_restriction({ highway = 'footway', foot = 'customers' }).reason)
      assert.are.equal('bicycle=destination', access_restriction({ highway = 'cycleway', bicycle = 'destination' }).reason)
      assert.are.equal('roads', access_restriction({ highway = 'footway', foot = 'customers' }).level)
    end)

    it('informal=yes path without infrastructure hint', function()
      local restriction = access_restriction({ highway = 'path', informal = 'yes' })
      assert.are.same({ level = 'roads', reason = 'informal=yes', may_have_bike_infra = false }, restriction)
    end)

    it('indoor=yes footway without infrastructure hint', function()
      local restriction = access_restriction({ highway = 'footway', indoor = 'yes' })
      assert.are.same({ level = 'roads', reason = 'indoor=yes', may_have_bike_infra = false }, restriction)
    end)
  end)

  describe('level `way`', function()
    it('service=driveway without hint', function()
      local restriction = access_restriction({ highway = 'service', service = 'driveway' })
      assert.are.same({ level = 'way', reason = 'service=driveway', may_have_bike_infra = false }, restriction)
    end)

    it('keeps the service exceptions for explicit bicycle access', function()
      assert.is_nil(access_restriction({ highway = 'service', service = 'driveway', bicycle = 'designated' }))
      assert.is_nil(access_restriction({ highway = 'service', service = 'driveway', ['bicycle:left'] = 'lane' }))
      assert.is_nil(access_restriction({ highway = 'service', service = 'driveway', ['bicycle:both'] = 'track' }))
      assert.are.equal('way', access_restriction({ highway = 'service', service = 'driveway', ['bicycle:left'] = 'no' }).level)
    end)

    it('way/34144223: driveway with Z239 + 1022-10 has a hint', function()
      local restriction = access_restriction({
        highway = 'service',
        service = 'driveway',
        bicycle = 'yes',
        traffic_sign = 'DE:239,1022-10,1000-31',
      })
      assert.are.equal('way', restriction.level)
      assert.is_true(restriction.may_have_bike_infra)
    end)

    it('access/foot/bicycle private, delivery, permit', function()
      assert.are.same(
        { level = 'way', reason = 'access=private', may_have_bike_infra = false },
        access_restriction({ highway = 'residential', access = 'private' })
      )
      assert.are.equal('access=delivery', access_restriction({ highway = 'residential', access = 'delivery' }).reason)
      assert.are.equal('access=permit', access_restriction({ highway = 'residential', access = 'permit' }).reason)
      assert.are.equal('foot=private', access_restriction({ highway = 'footway', foot = 'private' }).reason)
      assert.are.equal('bicycle=permit', access_restriction({ highway = 'cycleway', bicycle = 'permit' }).reason)
      assert.is_nil(access_restriction({ highway = 'residential', foot = 'private' })) -- foot only counts on footways
    end)

    it('access=private is not lifted by bicycle=yes or infrastructure hints', function()
      local restriction = access_restriction({ highway = 'path', access = 'private', bicycle = 'yes', traffic_sign = 'DE:240' })
      assert.are.equal('way', restriction.level)
      assert.are.equal('access=private', restriction.reason)
      assert.is_false(restriction.may_have_bike_infra)
    end)
  end)

  describe('precedence', function()
    it('way over a bicycle access that does not allow cycling: service=driveway + vehicle=destination', function()
      local restriction = access_restriction({ highway = 'service', service = 'driveway', vehicle = 'destination' })
      assert.are.equal('way', restriction.level)
      assert.are.equal('service=driveway', restriction.reason)
    end)

    it('way over roads: access=private + informal=yes, service + access=destination', function()
      assert.are.equal('access=private', access_restriction({ highway = 'path', access = 'private', informal = 'yes' }).reason)
      assert.are.equal('service=driveway', access_restriction({ highway = 'service', service = 'driveway', access = 'destination' }).reason)
    end)

    it('access tag before informal within `roads`', function()
      local restriction = access_restriction({ highway = 'path', access = 'destination', informal = 'yes' })
      assert.are.equal('access=destination', restriction.reason)
      assert.is_false(restriction.may_have_bike_infra)
    end)
  end)

  describe('may_have_bike_infra', function()
    local hint = ACCESS.may_have_bike_infra

    it('is false for plain restricted ways', function()
      assert.is_false(hint({ highway = 'service', service = 'driveway' }))
      assert.is_false(hint({ highway = 'service', service = 'parking_aisle', surface = 'asphalt', oneway = 'yes' }))
      assert.is_false(hint({ highway = 'service', bicycle = 'yes' }))
      assert.is_false(hint({ highway = 'path', informal = 'yes', foot = 'yes' }))
      -- driveways and parking aisles carry these all the time
      assert.is_false(hint({ highway = 'service', service = 'driveway', sidewalk = 'no' }))
      assert.is_false(hint({ highway = 'service', service = 'parking_aisle', ['sidewalk:both'] = 'separate' }))
      assert.is_false(hint({ highway = 'service', service = 'driveway', segregated = 'no' }))
    end)

    it('is true for the generous tag hints', function()
      assert.is_true(hint({ highway = 'cycleway' }))
      assert.is_true(hint({ highway = 'service', bicycle = 'designated' }))
      assert.is_true(hint({ highway = 'footway', bicycle = 'yes' }))
      assert.is_true(hint({ highway = 'path', bicycle = 'yes' }))
      assert.is_true(hint({ highway = 'service', ['cycleway:right'] = 'lane' }))
      assert.is_true(hint({ highway = 'service', ['bicycle:left'] = 'yes' }))
      assert.is_true(hint({ highway = 'service', bicycle = 'yes', segregated = 'no' }))
      assert.is_true(hint({ highway = 'service', ['sidewalk:both:bicycle'] = 'yes' }))
      assert.is_true(hint({ highway = 'service', ['sidewalk:left:traffic_sign'] = 'DE:240' }))
      for _, sign in ipairs({ '237', '239', '240', '241', '242', '244', '1022-10' }) do
        assert.is_true(hint({ highway = 'service', traffic_sign = 'DE:' .. sign }), sign)
      end
    end)
  end)

  describe('has_own_bike_infra', function()
    it('needs infrastructure with a category on any side', function()
      assert.is_false(ACCESS.has_own_bike_infra({}))
      assert.is_false(ACCESS.has_own_bike_infra({ { _side = 'self', _infrastructureExists = false, category = 'data_no' } }))
      assert.is_false(ACCESS.has_own_bike_infra({ { _side = 'self', _infrastructureExists = true } }))
      assert.is_true(ACCESS.has_own_bike_infra({ { _side = 'self', _infrastructureExists = true, category = 'footAndCyclewayShared_isolated' } }))
      assert.is_true(ACCESS.has_own_bike_infra({ { _side = 'right', _infrastructureExists = true, category = 'cyclewayOnHighway_exclusive' } }))
    end)
  end)

  describe('after_categorisation (stage 3)', function()
    ---@param tags table
    ---@return table|nil restriction before
    ---@return table|nil restriction after
    ---@return table[] cycleways
    local function stage_three(tags)
      local before = access_restriction(tags)
      local cycleways = categorize(tags)
      return before, ACCESS.after_categorisation(before, tags, cycleways), cycleways
    end

    it('way/34144223: driveway with Z239 + 1022-10 stays restricted', function()
      local before, after, cycleways = stage_three({
        highway = 'service',
        service = 'driveway',
        bicycle = 'yes',
        traffic_sign = 'DE:239,1022-10,1000-31',
      })
      assert.is_nil(category_of(cycleways, 'self'))
      assert.are.same(before, after)
    end)

    it('driveway with Z240 and no bicycle tag becomes public as footAndCyclewayShared', function()
      local _, after, cycleways = stage_three({ highway = 'service', service = 'driveway', traffic_sign = 'DE:240' })
      assert.is_nil(after)
      assert.are.equal('footAndCyclewayShared_isolated', category_of(cycleways, 'self'))
    end)

    it('bicycle=yes alone does not make a driveway public', function()
      local before, after, cycleways = stage_three({ highway = 'service', service = 'driveway', bicycle = 'yes' })
      assert.is_nil(category_of(cycleways, 'self'))
      assert.are.same(before, after)
    end)

    it('driveway with a hint but no infrastructure stays restricted', function()
      local before, after = stage_three({ highway = 'service', service = 'driveway', ['cycleway:both'] = 'no' })
      assert.is_true(before.may_have_bike_infra)
      assert.are.equal('way', after.level)
    end)

    it('informal=yes with Z240 and no bicycle tag becomes public', function()
      local before, after, cycleways = stage_three({ highway = 'path', informal = 'yes', traffic_sign = 'DE:240' })
      assert.are.equal('roads', before.level)
      assert.is_nil(after)
      assert.is_truthy(category_of(cycleways, 'self'))
    end)

    it('indoor=yes footway without infrastructure stays restricted', function()
      local before, after = stage_three({ highway = 'footway', indoor = 'yes' })
      assert.is_false(before.may_have_bike_infra)
      assert.are.same(before, after)
    end)

    it('keeps the restriction of the access tags once infrastructure lifts the structural one', function()
      local before, after = stage_three({ highway = 'service', service = 'driveway', access = 'destination', traffic_sign = 'DE:240' })
      assert.are.equal('way', before.level)
      assert.are.same({ level = 'roads', reason = 'access=destination', may_have_bike_infra = false }, after)
    end)
  end)

  -- Guard for `may_have_bike_infra`: every tag combination that gets a bikelane category on a
  -- restricted way must have the hint. Tries the single tags and all pairs on every highway class
  -- that can be restricted. If this fails after a change in `bikelane_categories.lua`, extend
  -- `may_have_bike_infra` (generously) instead of weakening the test.
  describe('hint covers the bikelane categories', function()
    local highways = { 'service', 'track', 'path', 'footway', 'pedestrian', 'living_street', 'residential', 'steps' }
    local candidates = {
      { 'bicycle', 'yes' }, { 'bicycle', 'designated' }, { 'bicycle', 'permissive' }, { 'bicycle', 'no' },
      { 'foot', 'designated' }, { 'foot', 'yes' }, { 'foot', 'no' },
      { 'segregated', 'yes' }, { 'segregated', 'no' },
      { 'traffic_sign', 'DE:237' }, { 'traffic_sign', 'DE:239,1022-10' }, { 'traffic_sign', 'DE:1022-10' },
      { 'traffic_sign', 'DE:240' }, { 'traffic_sign', 'DE:241-30' }, { 'traffic_sign', 'DE:242.1' },
      { 'traffic_sign', 'DE:244.1' }, { 'traffic_sign', 'DE:1020-30' }, { 'traffic_sign', '237' }, { 'traffic_sign', 'none' },
      { 'traffic_sign:forward', 'DE:240' }, { 'oneway', 'yes' },
      { 'bicycle_road', 'yes' }, { 'vehicle', 'destination' }, { 'motor_vehicle', 'yes' },
      { 'cycleway', 'track' }, { 'cycleway', 'lane' }, { 'cycleway', 'link' }, { 'cycleway', 'crossing' },
      { 'cycleway', 'shared_lane' }, { 'cycleway', 'share_busway' }, { 'cycleway', 'opposite_track' },
      { 'cycleway:right', 'track' }, { 'cycleway:left', 'lane' }, { 'cycleway:both', 'lane' },
      { 'cycleway:right', 'shared_lane' }, { 'cycleway:both', 'separate' }, { 'cycleway:right:traffic_sign', 'DE:237' },
      { 'cycleway:lanes', 'no|lane|no' }, { 'bicycle:lanes', 'no|designated|no' },
      { 'sidewalk:both', 'yes' }, { 'sidewalk:both:bicycle', 'yes' }, { 'sidewalk:right:bicycle', 'designated' },
      { 'sidewalk', 'no' }, { 'sidewalk:bicycle', 'yes' }, { 'sidewalk:left', 'separate' },
      { 'sidewalk:both:foot', 'designated' }, { 'sidewalk:both:segregated', 'no' }, { 'sidewalk:both:footway', 'crossing' },
      { 'sidewalk:both:traffic_sign', 'DE:240' }, { 'sidewalk:right:traffic_sign', 'DE:239,1022-10' },
      { 'bicycle:right', 'yes' }, { 'bicycle:both', 'designated' },
      { 'footway', 'crossing' }, { 'path', 'crossing' }, { 'footway', 'sidewalk' },
      { 'is_sidepath', 'yes' }, { 'is_sidepath', 'no' }, { 'mtb:scale', '0' },
    }

    ---@param tags table
    local function assert_hint_for_infra(tags)
      local cycleways = categorize(copy_tags(tags))
      if ACCESS.has_own_bike_infra(cycleways) then
        assert.is_true(ACCESS.may_have_bike_infra(tags), 'category matched without hint: ' .. require('inspect')(tags))
      end
    end

    it('single tags and pairs on every highway class', function()
      local matched = 0
      for _, highway in ipairs(highways) do
        for i, first in ipairs(candidates) do
          assert_hint_for_infra({ highway = highway, [first[1]] = first[2] })
          for j = i + 1, #candidates do
            local second = candidates[j]
            if second[1] ~= first[1] then
              local tags = { highway = highway, [first[1]] = first[2], [second[1]] = second[2] }
              assert_hint_for_infra(tags)
              if ACCESS.has_own_bike_infra(categorize(copy_tags(tags))) then
                matched = matched + 1
              end
            end
          end
        end
      end
      -- the search must not be vacuous
      assert.is_true(matched > 500, 'only ' .. matched .. ' matches')
    end)

    -- Pairs cannot reach the categories that combine `segregated`, `bicycle` and `foot`.
    it('segregated, bicycle and foot triples on every highway class', function()
      for _, highway in ipairs(highways) do
        for _, segregated in ipairs({ 'yes', 'no' }) do
          for _, bicycle in ipairs({ 'yes', 'designated', 'permissive', 'no' }) do
            for _, foot in ipairs({ 'yes', 'designated', 'no' }) do
              assert_hint_for_infra({ highway = highway, segregated = segregated, bicycle = bicycle, foot = foot })
            end
          end
        end
      end
    end)

    it('finds one positive example per category family that can occur on restricted ways', function()
      local examples = {
        { { highway = 'service', bicycle_road = 'yes' }, 'bicycleRoad' },
        { { highway = 'service', traffic_sign = 'DE:244.1' }, 'bicycleRoad' },
        { { highway = 'service', bicycle_road = 'yes', vehicle = 'destination' }, 'bicycleRoad_vehicleDestination' },
        { { highway = 'pedestrian', informal = 'yes', bicycle = 'yes' }, 'pedestrianAreaBicycleYes' },
        { { highway = 'service', traffic_sign = 'DE:240' }, 'footAndCyclewayShared' },
        { { highway = 'service', segregated = 'no', bicycle = 'yes', foot = 'yes' }, 'footAndCyclewayShared' },
        { { highway = 'path', traffic_sign = 'DE:241-30', informal = 'yes' }, 'footAndCyclewaySegregated' },
        { { highway = 'service', traffic_sign = 'DE:237' }, 'cycleway' },
        { { highway = 'footway', indoor = 'yes', bicycle = 'yes' }, 'footwayBicycleYes' },
        { { highway = 'path', informal = 'yes', bicycle = 'designated' }, 'needsClarification' },
        { { highway = 'footway', informal = 'yes', bicycle = 'designated' }, 'needsClarification' },
        { { highway = 'cycleway', indoor = 'yes', cycleway = 'link' }, 'cyclewayLink' },
        { { highway = 'footway', informal = 'yes', footway = 'crossing', bicycle = 'yes' }, 'crossing' },
        { { highway = 'service', ['cycleway:right'] = 'lane' }, 'cyclewayOnHighway' },
        { { highway = 'service', ['cycleway:both'] = 'track' }, 'cycleway' },
        { { highway = 'service', ['sidewalk:both:bicycle'] = 'yes', ['sidewalk:both'] = 'yes' }, 'footwayBicycleYes' },
        { { highway = 'service', ['bicycle:lanes'] = 'no|designated|no', oneway = 'no' }, 'cyclewayOnHighwayBetweenLanes' },
      }
      for _, example in ipairs(examples) do
        local tags, expected = example[1], example[2]
        local cycleways = categorize(copy_tags(tags))
        local found = false
        for _, cycleway in ipairs(cycleways) do
          if cycleway._infrastructureExists and cycleway.category and string.find(cycleway.category, expected, 1, true) then
            found = true
          end
        end
        assert.is_true(found, 'expected ' .. expected .. ' for ' .. require('inspect')(tags))
        assert.is_true(ACCESS.may_have_bike_infra(tags), 'no hint for ' .. require('inspect')(tags))
      end
    end)
  end)
end)
