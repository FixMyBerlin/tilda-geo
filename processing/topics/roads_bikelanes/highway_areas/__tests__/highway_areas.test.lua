describe('highway_areas', function()
  local highway_areas = require('topics.roads_bikelanes.roads_bikelanes_highway_areas')

  describe('is_highway_area_way', function()
    it('accepts closed ways with highway and area=yes', function()
      assert.is_true(highway_areas.is_highway_area_way({
        type = 'way',
        is_closed = true,
        tags = { highway = 'pedestrian', area = 'yes' },
      }))
    end)

    it('accepts closed ways with area:highway', function()
      assert.is_true(highway_areas.is_highway_area_way({
        type = 'way',
        is_closed = true,
        tags = { ['area:highway'] = 'pedestrian' },
      }))
    end)

    it('rejects open ways', function()
      assert.is_false(highway_areas.is_highway_area_way({
        type = 'way',
        is_closed = false,
        tags = { highway = 'pedestrian', area = 'yes' },
      }))
    end)

    it('rejects closed ways without highway area tags', function()
      assert.is_false(highway_areas.is_highway_area_way({
        type = 'way',
        is_closed = true,
        tags = { highway = 'pedestrian' },
      }))
    end)
  end)

  describe('should_skip_highway_area', function()
    it('does not skip area=yes highways', function()
      assert.is_false(highway_areas.should_skip_highway_area({
        highway = 'pedestrian',
        area = 'yes',
      }))
    end)

    it('skips disallowed highway classes', function()
      assert.is_true(highway_areas.should_skip_highway_area({
        highway = 'platform',
        area = 'yes',
      }))
    end)

    it('skips piers', function()
      assert.is_true(highway_areas.should_skip_highway_area({
        highway = 'pedestrian',
        area = 'yes',
        man_made = 'pier',
      }))
    end)

    it('skips leisure tracks', function()
      assert.is_true(highway_areas.should_skip_highway_area({
        highway = 'path',
        area = 'yes',
        leisure = 'track',
      }))
    end)
  end)
end)
