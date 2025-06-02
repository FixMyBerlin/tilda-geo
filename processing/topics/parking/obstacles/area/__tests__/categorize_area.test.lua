describe("`categorize_area`", function()
  require('init')
  require("categorize_area")
  require("Log")
  require("osm2pgsql")
  local result_tags_obstacles = require("result_tags_obstacles")

  it('no category matches', function()
    local object = {
      id = 1, type = 'way',
      tags = { ["amenity"] = 'bicycle_parking', }
    }
    local result = categorize_area(object)
    assert.are.equal(result.category, nil)
    assert.are.equal(result.object, nil)
  end)

  it('matches bicycle parkings', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ["amenity"] = 'bicycle_parking',
        ["position"] = 'lane',
        ["capacity"] = '10',
        ["everything"] = 'is_copied',
      }
    }
    local result = categorize_area(object)
    local row_tags = result_tags_obstacles(result)
    assert.are.equal(type(result.category), "table")
    assert.are.equal(result.category.id, "bicycle_parking")
    assert.are.equal(type(result.object), "table")
    assert.are.equal(result.object.tags.capacity, "10")
    assert.are.equal(row_tags.tags.capacity, 10)
    assert.are.equal(result.object.tags.everything, "is_copied")
  end)

  it('works with result_tags', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ["amenity"] = 'bicycle_parking',
        ["position"] = 'lane',
        ["capacity"] = '10',
        ["not_copied"] = 'not_in_further_tags',
        ["mapillary"] = '123',
      },
    }
    local result = categorize_area(object)
    local area = 100
    local result_tags = result_tags_obstacles(result, area)
    assert.are.equal(result_tags.id, "way/"..object.id)
    assert.are.equal(type(result_tags.meta.update_at), "string")
    assert.are.equal(result_tags.tags.osm_mapillary, object.tags.mapillary)
    assert.are.equal(result_tags.tags.not_copied, nil)
  end)

  it('parklet', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ["leisure"] = 'parklet',
      }
    }
    local result = categorize_area(object)
    assert.are.equal(result.category.id, "parklet")

    assert.are.equal(type(result.object), "table")
  end)

  it('road_marking_restricted_area', function()
    local object = {
      id = 1, type = 'way',
      tags = {
        ["area:highway"] = 'prohibited',
      },
    }
    local result = categorize_area(object)
    local area = 100
    local result_tags = result_tags_obstacles(result, area)
    assert.are.equal(result.category.id, "road_marking_restricted_area")
    assert.are.equal(type(result.object), "table")
    assert.are.equal(result_tags.id, "way/"..object.id)
  end)

  describe("handels category:get_capacity", function()
    it('handels area=nil', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ["amenity"] = 'bicycle_parking',
          ["position"] = 'lane',
        },
      }
      local result = categorize_area(object)
      local row_tags = result_tags_obstacles(result, nil)
      assert.are.equal(result.category.id, "bicycle_parking")
      assert.are.equal(row_tags.tags.category, "bicycle_parking")
    end)
    it('apply_parking_capacity_fallback=FALSE', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ["amenity"] = 'bicycle_parking',
          ["position"] = 'lane',
        },
      }
      local result = categorize_area(object)
      local row_tags = result_tags_obstacles(result, 100)
      local capacity_tags = result.category:get_capacity(result.object.tags, 100)
      assert.are.equal(result.category.id, "bicycle_parking")
      assert.are.equal(row_tags.tags.category, "bicycle_parking")
      assert.are.equal(capacity_tags, nil)
    end)
    it('apply_parking_capacity_fallback=TRUE', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ["amenity"] = 'parking',
          ["parking"] = 'lane',
          ["capacity"] = '12',
        },
      }
      local result = categorize_area(object)
      local row_tags = result_tags_obstacles(result, 100)
      local capacity_tags = result.category:get_capacity(result.object.tags, 100)
      assert.are.equal(result.category.id, "parking_lane")
      assert.are.equal(row_tags.tags.category, "parking_lane")
      assert.are.equal(capacity_tags.area, 100)
      assert.are.equal(capacity_tags.capacity, 12)
      assert.are.equal(capacity_tags.capacity_confidence, "high")
      assert.are.equal(capacity_tags.capacity_source, "tag")
      -- Log({capacity_tags, result, row_tags})
    end)
    it('apply_parking_capacity_fallback=TRUE', function()
      local object = {
        id = 1, type = 'way',
        tags = {
          ["amenity"] = 'parking',
          ["parking"] = 'lane',
        },
      }
      local result = categorize_area(object)
      local row_tags = result_tags_obstacles(result, 100)
      local capacity_tags = result.category:get_capacity(result.object.tags, 100)
      assert.are.equal(result.category.id, "parking_lane")
      assert.are.equal(row_tags.tags.category, "parking_lane")
      assert.are.equal(capacity_tags.area, 100)
      assert.are.equal(capacity_tags.capacity, 7)
      assert.are.equal(capacity_tags.capacity_confidence, "medium")
      assert.are.equal(capacity_tags.capacity_source, "area")
      -- Log({capacity_tags, result, row_tags})
    end)
  end)
end)
