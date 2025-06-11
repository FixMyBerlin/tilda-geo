
describe("off_street_parking_area_categories", function()
  require('init')
  require('Log')
  local off_street_parking_area_categories = require("off_street_parking_area_categories")
  local categorize_off_street_parking = require('categorize_off_street_parking')
  local result_tags_off_street_parking = require('result_tags_off_street_parking')
  local round = require('round')

  describe("capacity", function()
    it("case capacity tag", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "underground", capacity = "10" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local capacity = category_result.category:get_capacity(object.tags, 100)
      assert.are.equal(capacity.capacity, 10)
      assert.are.equal(capacity.capacity_confidence, "high")
      assert.are.equal(capacity.capacity_source, "tag")
    end)
    it("case area for unterground", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "underground" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 100
      local capacity = category_result.category:get_capacity(object.tags, area)
      assert.are.equal(capacity.capacity, round(area / 31.3, 0))
      assert.are.equal(capacity.capacity_confidence, "medium")
      assert.are.equal(capacity.capacity_source, "area")
    end)
    it("case area for surface small", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "surface" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 100
      local capacity = category_result.category:get_capacity(object.tags, area)
      assert.are.equal(capacity.capacity, round(area / 14.5, 0))
      assert.are.equal(capacity.capacity_confidence, "medium")
      assert.are.equal(capacity.capacity_source, "area")
    end)
    it("case area for surface small", function()
      local object = { id = 1, type = 'way', tags = { amenity = "parking", parking = "surface" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local area = 200
      local capacity = category_result.category:get_capacity(object.tags, area)
      assert.are.equal(capacity.capacity, round(area / 21.7, 0))
      assert.are.equal(capacity.capacity_confidence, "medium")
      assert.are.equal(capacity.capacity_source, "area")
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
      assert.are.equal(tags_result.tags.building, "garages")
      assert.are.equal(tags_result.tags.access, "private")
    end)

    it("matches garage", function()
      local object = { id = 1, type = 'way', tags = { building = "garage", capacity = "5", access = "customers" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "garage")
      assert.are.equal(tags_result.tags.category, "garage")
      assert.are.equal(tags_result.tags.building, "garage")
      assert.are.equal(tags_result.tags.access, "customers")
    end)

    it("matches carport", function()
      local object = { id = 1, type = 'way', tags = { building = "carport", capacity = "2", access = "permissive" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)
      local tags_result = result_tags_off_street_parking(category_result)

      assert.are.equal(category_result.category.id, "carport")
      assert.are.equal(tags_result.tags.category, "carport")
      assert.are.equal(tags_result.tags.building, "carport")
      assert.are.equal(tags_result.tags.access, "permissive")
    end)

    it("does not match unrelated building", function()
      local object = { id = 1, type = 'way', tags = { building = "house", capacity = "1" } }
      local category_result = categorize_off_street_parking(object, off_street_parking_area_categories)

      assert.is_nil(category_result.category)
    end)
  end)
end)
