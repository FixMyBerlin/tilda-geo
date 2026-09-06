describe('highway_areas', function()
  local highway_areas = require('topics.roads_bikelanes.roads_bikelanes_highway_areas')
  local EXIT = require('topics.roads_bikelanes.helper.exit_processing')

  describe('is_highway_area', function()
    it('accepts closed ways with highway and area=yes', function()
      assert.is_true(highway_areas.is_highway_area({
        type = 'way',
        is_closed = true,
        tags = { highway = 'pedestrian', area = 'yes' },
      }))
    end)

    it('rejects area:highway without highway+area=yes', function()
      assert.is_false(highway_areas.is_highway_area({
        type = 'way',
        is_closed = true,
        tags = { ['area:highway'] = 'pedestrian' },
      }))
    end)

    it('rejects open ways', function()
      assert.is_false(highway_areas.is_highway_area({
        type = 'way',
        is_closed = false,
        tags = { highway = 'pedestrian', area = 'yes' },
      }))
    end)

    it('rejects closed ways without area=yes', function()
      assert.is_false(highway_areas.is_highway_area({
        type = 'way',
        is_closed = true,
        tags = { highway = 'pedestrian' },
      }))
    end)

    it('accepts relations with highway and area=yes', function()
      assert.is_true(highway_areas.is_highway_area({
        type = 'relation',
        tags = { highway = 'pedestrian', area = 'yes' },
      }))
    end)
  end)

  describe('exit_processing with include_areas', function()
    it('keeps area=yes when include_areas is true', function()
      assert.is_false(EXIT.exit_processing({
        highway = 'pedestrian',
        area = 'yes',
      }, true))
    end)

    it('still skips disallowed highway classes', function()
      assert.is_true(EXIT.exit_processing({
        highway = 'platform',
        area = 'yes',
      }, true))
    end)

    it('still skips piers', function()
      assert.is_true(EXIT.exit_processing({
        highway = 'pedestrian',
        area = 'yes',
        man_made = 'pier',
      }, true))
    end)
  end)
end)
