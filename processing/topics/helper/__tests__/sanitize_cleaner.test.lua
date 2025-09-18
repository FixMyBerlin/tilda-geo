
require('init')
local sanitize_cleaner = require('sanitize_cleaner')
local SANITIZE_VALUES = require('sanitize_values')

describe("sanitize_cleaner", function()
  it("returns cleaned tags and no replaced if all allowed", function()
    local tags_to_clean = { foo = "foo_value", bar = "bar_value" }
    local object_tags = { foo = "foo_value", bar = "bar_value" }
    local cleaned, replaced = sanitize_cleaner.split_cleaned_and_replaced_tags(tags_to_clean, object_tags)
    assert.are.same(cleaned, { foo = "foo_value", bar = "bar_value" })
    assert.are.same(replaced, {})
  end)

  it("replaces disallowed values with nil and collects replaced", function()
    local tags_to_clean = { foo = "foo_value", nono = SANITIZE_VALUES.disallowed }
    local object_tags = { foo = "foo_value", nono = "nono_value" }
    local cleaned, replaced = sanitize_cleaner.split_cleaned_and_replaced_tags(tags_to_clean, object_tags)
    assert.are.same(cleaned, { foo = "foo_value", nono = nil })
    assert.are.same(replaced, { nono = "nono_value" } )
  end)

  it("handles multiple disallowed values", function()
    local tags_to_clean = { foo = "foo_value", nono = SANITIZE_VALUES.disallowed, nono2 = SANITIZE_VALUES.disallowed }
    local object_tags = { foo = "foo_value", nono = "nono_value", nono2 = "nono2_value" }
    local cleaned, replaced = sanitize_cleaner.split_cleaned_and_replaced_tags(tags_to_clean, object_tags)
    assert.are.same(cleaned, { foo = "foo_value", nono = nil, nono2 = nil })
    assert.are.same(replaced, { nono = "nono_value", nono2 = "nono2_value" })
  end)
end)
