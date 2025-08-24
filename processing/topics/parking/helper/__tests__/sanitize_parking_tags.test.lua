require('init')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

describe("sanitize_parking_tags", function()
  describe("parking_extended", function()
    it("returns sanitized value if present", function()
      local object = { tags = { parking = "lane" }, _parent_tags = {} }
      local result = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, object._parent_tags.dual_carriageway)
      assert.are.equal(result, "lane")
    end)
    it("returns 'not_expected' if dual_carriageway is yes and value is nil", function()
      local object = { tags = {}, _parent_tags = { dual_carriageway = "yes" } }
      local result = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, object._parent_tags.dual_carriageway)
      assert.are.equal(result, "not_expected")
    end)
    it("returns 'missing' if no value and not dual_carriageway", function()
      local object = { tags = {}, _parent_tags = {} }
      local result = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, object._parent_tags.dual_carriageway)
      assert.are.equal(result, "missing")
    end)
    it("returns handels case without _parent_tags", function()
      local object = { tags = { parking = "lane" } }
      local result = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, nil)
      assert.are.equal(result, "lane")
    end)
  end)
end)
