
describe("off_street_parking_area_categories", function()
  require('init')
  require('Log')
  require("osm2pgsql")
  local off_street_parking_area_categories = require("off_street_parking_area_categories")
  local categorize_off_street_parking = require('categorize_off_street_parking')
  local result_tags_off_street_parking = require('result_tags_off_street_parking')
  local round = require('round')

  describe("capacity", function()
    it("case capacity tag", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "underground", capacity = "10" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local capacity = category_result.category:get_capacity(object.tags, 100)
      assert.are.equal(capacity.value, 10)
      assert.are.equal(capacity.confidence, "high")
      assert.are.equal(capacity.source, "tag")
    end)
    it("case area for unterground", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "underground" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 100
      local capacity = category_result.category:get_capacity(object.tags, area)
      assert.are.equal(capacity.value, round(area / 31.3, 0))
      assert.are.equal(capacity.confidence, "medium")
      assert.are.equal(capacity.source, "area")
    end)
    it("case area for surface small (area < 120)", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "surface" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 100
      local capacity = category_result.category:get_capacity(object.tags, area)
      assert.are.equal(capacity.value, round(area / 14.8, 0))
      assert.are.equal(capacity.confidence, "medium")
      assert.are.equal(capacity.source, "area")
    end)
    it("case area for surface medium (120 <= area <= 1500)", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "surface" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 200
      local capacity = category_result.category:get_capacity(object.tags, area)
      local AREA_SMALL_MAX, AREA_LARGE_MIN = 120, 1500
      local capacity_at_small, capacity_at_large = 8, 50
      local factor = (AREA_SMALL_MAX / capacity_at_small)
        + ((AREA_LARGE_MIN / capacity_at_large) - (AREA_SMALL_MAX / capacity_at_small))
        * (area - AREA_SMALL_MAX) / (AREA_LARGE_MIN - AREA_SMALL_MAX)
      assert.are.equal(capacity.value, round(area / factor, 0))
      assert.are.equal(capacity.confidence, "medium")
      assert.are.equal(capacity.source, "area")
    end)
    it("surface capacity is continuous at boundary 120 m²", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "surface" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local c119 = category_result.category:get_capacity(object.tags, 119)
      local c120 = category_result.category:get_capacity(object.tags, 120)
      local c121 = category_result.category:get_capacity(object.tags, 121)
      local AREA_SMALL_MAX, AREA_LARGE_MIN = 120, 1500
      local capacity_at_small, capacity_at_large = 8, 50
      local factor_120 = AREA_SMALL_MAX / capacity_at_small
      local factor_121 = factor_120
        + ((AREA_LARGE_MIN / capacity_at_large) - (AREA_SMALL_MAX / capacity_at_small))
        * (121 - AREA_SMALL_MAX) / (AREA_LARGE_MIN - AREA_SMALL_MAX)
      assert.are.equal(c119.value, round(119 / 14.8, 0))
      assert.are.equal(c120.value, round(120 / factor_120, 0))
      assert.are.equal(c121.value, round(121 / factor_121, 0))
      assert.is_true(math.abs(c120.value - c119.value) <= 1 and math.abs(c121.value - c120.value) <= 1)
    end)
    it("surface capacity is continuous at boundary 1500 m²", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "surface" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local c1499 = category_result.category:get_capacity(object.tags, 1499)
      local c1500 = category_result.category:get_capacity(object.tags, 1500)
      local c1501 = category_result.category:get_capacity(object.tags, 1501)
      local AREA_SMALL_MAX, AREA_LARGE_MIN = 120, 1500
      local capacity_at_small, capacity_at_large = 8, 50
      local factor_1499 = (AREA_SMALL_MAX / capacity_at_small)
        + ((AREA_LARGE_MIN / capacity_at_large) - (AREA_SMALL_MAX / capacity_at_small))
        * (1499 - AREA_SMALL_MAX) / (AREA_LARGE_MIN - AREA_SMALL_MAX)
      assert.are.equal(c1499.value, round(1499 / factor_1499, 0))
      assert.are.equal(c1500.value, round(1500 / (AREA_LARGE_MIN / capacity_at_large), 0))
      assert.are.equal(c1501.value, round(1501 / (AREA_LARGE_MIN / capacity_at_large), 0))
      assert.is_true(math.abs(c1500.value - c1499.value) <= 1 and math.abs(c1501.value - c1500.value) <= 1)
    end)
    it("case est_capacity without capacity uses tag_estimation and does not use area", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "underground", est_capacity = "20" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 100
      local capacity = category_result.category:get_capacity(object.tags, area)
      assert.are.equal(capacity.value, 20)
      assert.are.equal(capacity.confidence, "medium")
      assert.are.equal(capacity.source, "tag_estimation")
    end)
  end)

  describe("building case", function()
    it("matches unterground", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "underground", capacity = "10", access = "private" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "underground")
      assert.are.equal(tags_result.tags.category, "underground")
      assert.are.equal(tags_result.tags.parking, "underground")
      assert.are.equal(tags_result.tags.access, "private")
    end)
    it("matches garages", function()
      local object = { id = 1, type = 'way', tags = { building = "garages", capacity = "10", access = "private" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "garage")
      assert.are.equal(tags_result.tags.category, "garage")
      assert.are.equal(tags_result.tags.parking, "garage")
      assert.are.equal(tags_result.tags.access, "private")
    end)

    it("matches garage", function()
      local object = { id = 1, type = 'way', tags = { building = "garage", capacity = "5", access = "customers" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "garage")
      assert.are.equal(tags_result.tags.category, "garage")
      assert.are.equal(tags_result.tags.parking, "garage")
      assert.are.equal(tags_result.tags.access, "customers")
    end)

    it("matches carport", function()
      local object = { id = 1, type = 'way', tags = { building = "carport", capacity = "2", access = "permissive" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "carport")
      assert.are.equal(tags_result.tags.category, "carport")
      assert.are.equal(tags_result.tags.parking, "carport")
      assert.are.equal(tags_result.tags.access, "permissive")
    end)

    it("matches multi-storey", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "multi-storey", capacity = "50", access = "yes" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "multi-storey")
      assert.are.equal(tags_result.tags.category, "multi-storey")
      assert.are.equal(tags_result.tags.parking, "multi-storey")
      assert.are.equal(tags_result.tags.access, "public")
    end)

    it("matches building=parking", function()
      local object = { id = 1, type = 'way', tags = { building = "parking", capacity = "30", access = "private" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "multi-storey")
      assert.are.equal(tags_result.tags.category, "multi-storey")
      assert.are.equal(tags_result.tags.parking, "multi-storey")
      assert.are.equal(tags_result.tags.access, "private")
    end)

    it("does not match unrelated building", function()
      local object = { id = 1, type = 'way', tags = { building = "house", capacity = "1" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)

      assert.is_nil(category_result.category)
    end)
  end)
end)
