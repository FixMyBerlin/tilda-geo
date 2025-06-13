require('init')
require('result_tags_value_helpers')

describe("parking_value", function()
    it("returns sanitized value if present", function()
        local object = { tags = { parking = "lane" }, _parent_tags = {} }
        local result = parking_value(object)
        assert.are.equal(result, "lane")
    end)
    it("returns 'not_expected' if dual_carriageway is yes and value is nil", function()
        local object = { tags = {}, _parent_tags = { dual_carriageway = "yes" } }
        local result = parking_value(object)
        assert.are.equal(result, "not_expected")
    end)
    it("returns 'missing' if no value and not dual_carriageway", function()
        local object = { tags = {}, _parent_tags = {} }
        local result = parking_value(object)
        assert.are.equal(result, "missing")
    end)
end)
