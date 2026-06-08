local SET = require('topics.helper.sets')
local extract_keys = require('topics.helper.extract_keys')
local CATEGORY_VALUES = require('topics.poiClassification.helper.category_values_with_categories')

local ALLOWED_VALUES = SET.set(extract_keys(CATEGORY_VALUES))

-- Common OSM `shop=*` spellings mapped to canonical keys in `category_values_with_categories`.
local SHOP_VALUE_ALIASES = {
  beauty = 'beauty_shop',
  bicycle = 'bicycle_shop',
  books = 'bookshop',
  car = 'car_dealership',
  computer = 'computer_shop',
  furniture = 'furniture_shop',
  gift = 'gift_shop',
  jewelry = 'jeweller',
  mobile_phone = 'mobile_phone_shop',
  outdoor = 'outdoor_shop',
  sports = 'sports_shop',
  shoes = 'shoe_shop',
  toys = 'toy_shop',
  travel_agency = 'travel_agent',
  video = 'video_shop',
}

---@param raw_value string|nil
---@return string|nil
local function normalize_shop_lookup_value(raw_value)
  if not raw_value then return raw_value end
  return SHOP_VALUE_ALIASES[raw_value] or raw_value
end

--- Exact OSM tag value match for import guards (`exit_processing`). Shop aliases do not apply.
---@param raw_value string|nil
---@return boolean
local function is_allowed_import_value(raw_value)
  if not raw_value then return false end
  return ALLOWED_VALUES[raw_value] == true
end

--- Alias-aware category lookup for result tags.
---@param raw_value string|nil
---@return string|nil
local function resolve_category(raw_value)
  if not raw_value then return nil end
  return CATEGORY_VALUES[normalize_shop_lookup_value(raw_value)]
end

--- Suffix for `type` (`shop-*`, `amenity-*`, …). Listed values keep the OSM string; others use `fallback`.
--- Shop aliases count as listed; amenity/tourism/leisure use exact keys only.
---@param prefix 'amenity'|'shop'|'tourism'|'leisure'
---@param raw_value string|nil
---@return string|nil
local function type_suffix(prefix, raw_value)
  if not raw_value then return raw_value end

  if prefix == 'shop' then
    local normalized_value = normalize_shop_lookup_value(raw_value)
    if ALLOWED_VALUES[raw_value] or ALLOWED_VALUES[normalized_value] then
      return raw_value
    end
    return 'fallback'
  end

  if ALLOWED_VALUES[raw_value] then
    return raw_value
  end

  return 'fallback'
end

---@class SanitizePoiClassificationTags
---@field is_allowed_import_value fun(raw_value: string|nil): boolean
---@field resolve_category fun(raw_value: string|nil): string|nil
---@field type_suffix fun(prefix: 'amenity'|'shop'|'tourism'|'leisure', raw_value: string|nil): string|nil
---@type SanitizePoiClassificationTags
return {
  is_allowed_import_value = is_allowed_import_value,
  resolve_category = resolve_category,
  type_suffix = type_suffix,
}
