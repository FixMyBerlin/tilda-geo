require('init')
require('Log')

local invert_time_condition = require('invert_time_condition')
local parse_conditional_value = require('parse_conditional_value')
local sort_condition_class = require('sort_condition_class')
local subtract_time_ranges = require('subtract_time_ranges')

local SEPARATOR = ';'

---@alias conditional_entry {value: string, condition: string}

-- Get specific sub-conditions from a conditional string
---@param condition_list conditional_entry[]|nil Parsed conditional value list
---@param target_value string|nil Target value string to match against. If empty, all values are matched.
---@return string|nil Condition string if match found (comma-separated if multiple matches for the same target value found), nil otherwise
local function get_sub_condition(condition_list, target_value)
  if not condition_list or #condition_list < 1 then
    return nil
  end

  local matched_conditions = {}

  -- Iterate over all parsed conditional entries
  for _, entry in ipairs(condition_list) do
    if entry.value == target_value or target_value == '' then
      table.insert(matched_conditions, entry.condition)
    end
  end

  if #matched_conditions > 0 then
    return table.concat(matched_conditions, ", ")
  end

  return nil
end

-- Helper function to check if a value is empty or 'no' or 'none'
---@param value string|nil The value to check
---@return boolean True if value is empty, 'no', or 'none'
local function is_empty_or_no(value)
  return not value or value == '' or value == 'no' or value == 'none'
end

-- Helper function to check if an access value indicates a free/public access
---@param value string|nil The value to check
---@return boolean True if value indicates a free/public access
local function is_free_access(value)
  return value == '' or value == 'yes' or value == 'destination' or value == 'designated' or value == 'permissive'
end

-- Helper function to check if a value is in an array
---@param value string|nil The value to check
---@param list string[] Array of values to match against
---@return boolean True if value is in the array
local function is_in(value, list)
  for i, val in ipairs(list) do
      if val == value then
          return true
      end
  end
  return false
end

-- Helper function to check if at least one value from an array also exists in an other array
---@param listA string[] The first array
---@param listB string[] The second array
---@return boolean True if there is at least one common string in both arrays
local function has_common(listA, listB)
  if not listA or not listB or #listA == 0 or #listB == 0 then
    return false
  end
  -- set from first array for quick lookup
  local lookup = {}
  for _, value in ipairs(listA) do
      lookup[value] = true
  end
  -- check whether an element from listB exists in the lookup set
  for _, value in ipairs(listB) do
      if lookup[value] then
          return true
      end
  end
  return false
end

-- Copy a list
local function copy_list(list)
  local new_list = {}
  for i, v in ipairs(list) do
    new_list[i] = v
  end
  return new_list
end

-- Delete an item from a list
local function remove_value(list, value)
  if not list or #list < 1 then
    return list
  end
  for i, v in ipairs(list) do
    if v == value then
      table.remove(list, i)
      return list
    end
  end
end

--------------------------------
-- PARKING RESTRICTION PARSING
--------------------------------

-- Classify parking conditions into merged categories
-- Based on [street_parking.py](https://github.com/SupaplexOSM/street_parking.py/blob/main/street_parking.py) vehicle restrictions processing
-- Uses only `tags` (e.g. unnested parking:left/right from the way, or full tags on a parking area). Highway-only tags must not be merged in here for road-derived parkings.
---@param tags table<string, string|nil> Parking-scoped OSM tags (unnested `parking:*` side tags or element tags)
---@param default_category 'assumed_free'|'assumed_private' Default category to use when no condition is found
---@return {condition_category?: string}
function classify_parking_conditions(tags, default_category)
  local function t(k) return tags[k] end

  -- Initialize categories
  ---@type string[]
  local condition_class = {}
  local vehicle_designated = {}
  local vehicle_excluded = {}
  local vehicle_none_restriction = {}
  -- Hints for improving OSM tagging
  local warnings = {}

  -- Get base values that we need to interpret parking restrictions
  local fee = t('fee')
  local fee_conditional = parse_conditional_value(t('fee:conditional'))
  local access = t('motor_vehicle') or t('access')
  local access_conditional = parse_conditional_value(t('motor_vehicle:conditional')) or parse_conditional_value(t('access:conditional'))
  local maxstay = t('maxstay')
  if is_empty_or_no(maxstay) and t('maxstay:conditional') == 'yes' then
    maxstay = 'yes'
  end
  local maxstay_conditional = parse_conditional_value(t('maxstay:conditional'))
  local restriction = t('restriction')
  if is_empty_or_no(restriction) and t('restriction:conditional') == 'yes' then
    restriction = 'yes'
  end
  local restriction_conditional = parse_conditional_value(t('restriction:conditional'))
  local reason = t('reason')
  local reason_conditional = parse_conditional_value(t('reason:conditional'))
  local restriction_reason = t('restriction:reason')
  local restriction_reason_conditional = parse_conditional_value(t('restriction:reason:conditional'))
  local zone = t('zone')
  local maxweight = t('maxweight') or t('maxweightrating')
  local maxweight_conditional = parse_conditional_value(t('maxweight:conditional')) or parse_conditional_value(t('maxweightrating:conditional'))

  -- Warning indicator: "@" in non-conditional tags
  for _, tag in ipairs({ fee, access, maxstay, restriction, zone }) do
    if tag and string.find(tag, "@") then
      table.insert(warnings, string.format("Found '@' in the non-conditional value '%s'. Perhaps '%s:conditional' is meant?", tag, tag))
    end
  end

  -- vehicle access keys
  local vehicle_class_list = {
    'motorcar', -- we understand this synonym to 'passenger_car', see https://wiki.openstreetmap.org/wiki/Key:motorcar#Controversy
    'passenger_car', -- proposed explicit tagging for "passenger cars only"
    'disabled',
    'car_sharing',
    'motorcycle',
    'goods',
    'hgv',
    'bus',
    'tourist_bus',
    'coach',
    'psv',
    'taxi',
    'motorhome',
    'emergency',
    -- some access values that we can treat like vehicle types
    'delivery',
    'agricultural',
    'forestry',
  }
  -- vehicle keys that define their own restriction class
  local access_restriction_class_list = {'disabled', 'taxi', 'car_sharing'}

  -- vehicle restrictions that are still "free" parking (most vehicles are motorcars, so a "motorcar only" restriction should not lead to a restricted status)
  local free_vehicle_restriction_class_list = {'motorcar', 'passenger_car'}

  -- Process vehicle restrictions
  for _, vehicle_class in ipairs(vehicle_class_list) do
    local vehicle = t(vehicle_class)
    local vehicle_conditional = parse_conditional_value(t(vehicle_class .. ':conditional'))
    local restriction_vehicle = t('restriction:' .. vehicle_class)
    local restriction_vehicle_conditional = parse_conditional_value(t('restriction:' .. vehicle_class .. ':conditional'))

    -- Warning indicator: "@" in non-conditional vehicle tags
    if vehicle and string.find(vehicle, "@") then
      table.insert(warnings, string.format("Found '@' in the non-conditional value '%s'. Perhaps '%s:conditional' is meant?", vehicle, vehicle))
    end
    if restriction_vehicle and string.find(restriction_vehicle, "@") then
      table.insert(warnings, string.format("Found '@' in the non-conditional value '%s'. Perhaps '%s:conditional' is meant?", restriction_vehicle, restriction_vehicle))
    end

    -- Check for "none" restrictions (vehicle is allowed)
    -- Option 1: restriction:vehicle = none or restriction:vehicle:conditional ~ none @ (...)
    -- Option 2: restriction:conditional ~ none @ vehicle (e.g. for access modes like "delivery")
    if restriction_vehicle == 'none'
      or (restriction_vehicle_conditional and get_sub_condition(restriction_vehicle_conditional, 'none'))
      or get_sub_condition(restriction_conditional, 'none') == vehicle_class
    then
      table.insert(vehicle_none_restriction, vehicle_class)
    end

    -- Check for designated vehicles (vehicle is allowed)
    if vehicle == 'designated' or vehicle == 'yes' or restriction_vehicle == 'none' then
      table.insert(vehicle_designated, vehicle_class)
    end

    -- Check for excluded vehicles (vehicle is not allowed)
    if vehicle == 'no' then
      table.insert(vehicle_excluded, vehicle_class)
    end

    -- Merge similar vehicle classes into a common value
    local vehicle_normalize_map = {
      passenger_car = "motorcar",
      goods = "hgv",
      tourist_bus = "bus",
      coach = "bus",
      forestry = "agricultural"
    }
    local function normalize_vehicle_list(list, map)
      local seen = {}
      local result = {}

      for _, v in ipairs(list) do
        local new_v = map[v] or v

        if not seen[new_v] then
          seen[new_v] = true
          table.insert(result, new_v)
        end
      end

      return result
    end
    vehicle_designated = normalize_vehicle_list(vehicle_designated, vehicle_normalize_map)
    vehicle_excluded = normalize_vehicle_list(vehicle_excluded, vehicle_normalize_map)
    vehicle_none_restriction = normalize_vehicle_list(vehicle_none_restriction, vehicle_normalize_map)

    -- Process conditional vehicle restrictions
    if vehicle_conditional then
      if get_sub_condition(vehicle_conditional, 'designated') or get_sub_condition(vehicle_conditional, 'yes') then
        table.insert(vehicle_designated, vehicle_class)
      elseif get_sub_condition(vehicle_conditional, 'no') then
        table.insert(vehicle_excluded, vehicle_class)
      end
    end

    -- Process conditional restriction vehicle exceptions
    if restriction_vehicle_conditional and get_sub_condition(restriction_vehicle_conditional, 'none') then
      table.insert(vehicle_designated, vehicle_class)
    end
  end

  -- Helper function to add a condition class
  ---@param current_class string[] Current condition class list (modified in place)
  ---@param new_class string New condition class to add
  ---@param condition string|nil Optional condition string
  ---@return string[]
  local function add_condition_class(current_class, new_class, condition)
    if not new_class or new_class == '' then
      return current_class
    end
    if condition and condition ~= '' then
      new_class = new_class .. ' (' .. condition .. ')'
    end
    table.insert(current_class, new_class)
    return current_class
  end

  -- Helper function to check whether a specific condition class is in the condition class list
  -- Example: Find condition class "paid" in { "paid (Mo-Fr 09:00-22:00)" }
  ---@param class string Condition class to match
  ---@param class_list string[]|nil Optional condition class list. If nil or empty, the default conditional class list will be used
  ---@return string|nil Full condition class string, including conditions or exceptions; nil if not found
  local function has_condition_class(class, class_list)
    if not class or class == '' then
      return nil
    end
    if not class_list or class_list == '' then
      class_list = condition_class
    end
    for _, value in ipairs(class_list) do
      if string.match(value, "^" .. class) then
          return value
      end
    end
    return nil
  end

  -- Paid parking (with parking ticket only) or Mixed parking (with parking ticket or residential zone permission)
  local fee_cond_yes = get_sub_condition(fee_conditional, 'yes')
  local fee_cond_no = get_sub_condition(fee_conditional, 'no')
  local fee_class = 'paid'
  -- If there is a parking zone tag, zone permission holders can park there without parking ticket (= Mixed parking)
  if not is_empty_or_no(zone) then
    fee_class = 'mixed'
  end
  -- fee:conditional = yes @ (time) -> just add as paid time
  if fee_cond_yes then
    condition_class = add_condition_class(condition_class, fee_class, fee_cond_yes)
  elseif fee == 'yes' then
    -- fee=yes + fee:conditional = no @ (time) -> invert "no paying time" and add as paid time
    if fee_cond_no then
      local fee_cond_inverted = invert_time_condition(fee_cond_no)
      if fee_cond_inverted then
        condition_class = add_condition_class(condition_class, fee_class, fee_cond_inverted)
      -- Condition value can't be inverted? -> show as exception
      else
        condition_class = add_condition_class(condition_class, fee_class, 'except ' .. fee_cond_no)
        table.insert(warnings, string.format("Can not invert fee:conditional expression '%s'.", fee_cond_no))
      end
    -- fee=yes without conditionals -> just "paid" without condition
    else
      condition_class = add_condition_class(condition_class, fee_class)
    end
  end

  -- Residential parking only: residential zone and private/residential access
  if not is_empty_or_no(zone) then
    local public_cond = get_sub_condition(access_conditional, 'yes') or get_sub_condition(access_conditional, 'destination') or get_sub_condition(access_conditional, 'designated') or get_sub_condition(access_conditional, 'permissive')
    local private_cond = get_sub_condition(access_conditional, 'private')
    -- Option 1: zone + private (residential) access
    if access == 'private' or access == 'residents' or private_cond then
      condition_class = add_condition_class(condition_class, 'residents', invert_time_condition(public_cond))
    -- Option 2: zone + no_parking/standing/stopping restriction + none @ residents
    else
      local no_parking_cond = get_sub_condition(restriction_conditional, 'no_parking') or get_sub_condition(restriction_conditional, 'no_standing') or get_sub_condition(restriction_conditional, 'no_stopping')
      if no_parking_cond and get_sub_condition(restriction_conditional, 'none') == 'residents' then
        condition_class = add_condition_class(condition_class, 'residents', no_parking_cond)
      end
    end
  end

  -- Loading, charging or unspecified
  local restriction_types = { 'loading_only', 'charging_only', 'yes' }

  for _, rtype in ipairs(restriction_types) do
    local cond_key = rtype
    local class_key = 'unspecified'
    -- use a shot hand for our "*_only" class attributes
    if string.find(rtype, "_only") then
      class_key = rtype:gsub("_only$", "")
    end

    local cond_val = get_sub_condition(restriction_conditional, cond_key)

    if restriction == cond_key or cond_val then
      if vehicle_none_restriction and #vehicle_none_restriction > 0 then
        -- Exceptions for special vehicles, e.g. loading + emergency free
        local cond = cond_val
        if cond_val then
          cond = cond_val .. ') (except ' .. table.concat(vehicle_none_restriction, ", ")
        else
          cond = 'except ' .. table.concat(vehicle_none_restriction, ", ")
        end
        condition_class = add_condition_class(condition_class, class_key, cond)
      else
        condition_class = add_condition_class(condition_class, class_key, cond_val)
      end
    end
  end

  -- Private disabled parking
  local disabled_conditional = parse_conditional_value(t('disabled:conditional'))
  local private_disabled_cond = get_sub_condition(disabled_conditional, 'private')
  if (access == 'no' and t('disabled') == 'private') or
      (access_conditional and get_sub_condition(access_conditional, 'no') and private_disabled_cond)
  then
    condition_class = add_condition_class(condition_class, 'disabled_private', private_disabled_cond)
  end

  -- Weight restriction (maxweight or maxweightrating)
  if maxweight_conditional and #maxweight_conditional > 0 then
    local maxweight_interval = get_sub_condition(maxweight_conditional, '')
    local first_maxweight = maxweight_conditional[1]
    local maxweight_cond = first_maxweight and first_maxweight.value
    if maxweight_cond and not is_empty_or_no(maxweight_cond) then
      local suffix = maxweight_cond
      if tonumber(maxweight_cond) then
        suffix = maxweight_cond .. " t"
      end
      condition_class = add_condition_class(condition_class, 'maxweight', suffix .. ') (' .. maxweight_interval)
    end
  elseif not is_empty_or_no(maxweight) then
    local suffix = maxweight
    if tonumber(maxweight) then
      suffix = maxweight .. " t"
    end
    condition_class = add_condition_class(condition_class, 'maxweight', suffix)
  end

  -- Vehicle restrictions and public disabled, taxi or car sharing
  -- Option 1: positive access restrictions (access = no + vehicle = designated)
  if (vehicle_designated and #vehicle_designated > 0) and (access == 'no' or (access_conditional and get_sub_condition(access_conditional, 'no'))) then
    -- some vehicles like taxis have their own class
    local special_vehicle = {}
    local other_vehicle = copy_list(vehicle_designated)
    for _, vehicle in ipairs(access_restriction_class_list) do
      if is_in(vehicle, vehicle_designated) then
        table.insert(special_vehicle, vehicle)
        other_vehicle = remove_value(other_vehicle, vehicle)
      end
    end
    if #special_vehicle > 0 then
      local cond = get_sub_condition(access_conditional, 'no')
      -- other vehicle types can also be allowed; list them as exceptions
      if #other_vehicle > 0 then
        if cond then
          cond = cond .. ') (except ' .. table.concat(other_vehicle, ", ")
        else
          cond = 'except ' .. table.concat(other_vehicle, ", ")
        end
      end
      for _, vehicle in ipairs(special_vehicle) do
        condition_class = add_condition_class(condition_class, vehicle, cond)
      end
    -- at this point, we don't want to add "vehicle_restriction" for passenger cars, because vehicle restrictions for them should still be treated as “free parking”
    -- vehicle_restriction for passenger cars is added separately at the end
    elseif not has_common(vehicle_designated, free_vehicle_restriction_class_list) then
      -- concat designated vehicles and time conditions if present
      local condition = 'only ' .. table.concat(vehicle_designated, ", ")
      local no_access_cond = get_sub_condition(access_conditional, 'no')
      if no_access_cond then
        condition = condition .. ') (' .. no_access_cond
      end
      condition_class = add_condition_class(condition_class, 'vehicle_restriction', condition)
    end
  end
  -- Option 2: vehicle exceptions for no_parking/stopping rules are handled below at temporary no parking/stopping
  -- Option 3: negative access restrictions (vehicle = no) are handled at the end to prevent dropping the "free" class if motorcars aren't forbidden

  -- Other access restrictions
  local access_cond = get_sub_condition(access_conditional, '')
  if ((access and not is_free_access(access)) or access_cond)
    and not (vehicle_designated and #vehicle_designated > 0)
    and not has_condition_class('mixed')
    and not has_condition_class('residents')
    and not has_condition_class('disabled_private')
    and not has_condition_class('vehicle_restriction')
  then
    if access == 'private' and not access_cond then
      condition_class = add_condition_class(condition_class, 'private')
    elseif access and access_cond then
      condition_class = add_condition_class(condition_class, 'access_restriction', access .. ', ' .. access_cond)
    elseif access then
      condition_class = add_condition_class(condition_class, 'access_restriction', access)
    elseif access_cond then
      condition_class = add_condition_class(condition_class, 'access_restriction', access_cond)
    end
  end

  -- Time limited parking (maxstay)
  if maxstay_conditional and #maxstay_conditional > 0 then
    local maxstay_interval = get_sub_condition(maxstay_conditional, '')
    local first_maxstay = maxstay_conditional[1]
    local maxstay_cond = first_maxstay and first_maxstay.value -- Different conditions at the same spot are very uncommon, so we just need the first value.
    if maxstay_cond and not is_empty_or_no(maxstay_cond) and maxstay_cond ~= 'unlimited' then
      condition_class = add_condition_class(condition_class, 'time_limited', maxstay_cond .. ') (' .. maxstay_interval)
    end
  elseif not is_empty_or_no(maxstay) and maxstay ~= 'unlimited' then
    if maxstay == 'yes' then
      condition_class = add_condition_class(condition_class, 'time_limited')
    else
      condition_class = add_condition_class(condition_class, 'time_limited', maxstay)
    end
  end

  -- Warning indicator: zone tag without paid, residential, mixed or time_limited condition class
  if not is_empty_or_no(zone) and not (has_condition_class('paid') or has_condition_class('mixed') or has_condition_class('residents') or has_condition_class('time_limited')) then
    table.insert(warnings, "Zone tag without fee, fee:conditional or private/residential access.")
  end

  -- Free parking (no other restrictions and explicitely no fee, maxstay, zone or access restrictions)
  if #condition_class < 1
    and is_empty_or_no(fee)
    and is_empty_or_no(maxstay)
    and (
      not access
      or is_free_access(access)
      or has_common(vehicle_designated, free_vehicle_restriction_class_list)
      or has_common(vehicle_none_restriction, free_vehicle_restriction_class_list)
    )
    and (
      (
        is_empty_or_no(restriction)
        and not (get_sub_condition(restriction_conditional, 'no_parking') or get_sub_condition(restriction_conditional, 'no_standing') or get_sub_condition(restriction_conditional, 'no_stopping'))
      )
      or has_common(vehicle_none_restriction, free_vehicle_restriction_class_list)
    )
    and not has_common(vehicle_excluded, free_vehicle_restriction_class_list)
  then
    if is_empty_or_no(zone) then
      local free_str = 'assumed_free'
      if not access then
        free_str = default_category
      end
      if fee == 'no' and free_str == 'assumed_free' then
        free_str = 'free'
      end

      -- Add vehicle_restriction for passenger cars separately,
      -- because vehicle restrictions for passenger cars should still be treated as “free parking”
      if has_common(vehicle_designated, free_vehicle_restriction_class_list) then
        condition_class = add_condition_class(condition_class, free_str, 'only ' .. table.concat(vehicle_designated, ', '))
      else
        condition_class = add_condition_class(condition_class, free_str)
      end
    else
      -- Warning indicator: no restrictions, but a zone tag
      table.insert(warnings, "Zone tag without parsed restrictions.")
    end
  end

  -- Temporary no parking/standing/stopping
  local restr = { 'no_stopping', 'no_parking', 'no_standing' }
  for _, r in ipairs(restr) do
    local cond = get_sub_condition(restriction_conditional, r)
    if restriction == r or cond then
      -- Handle vehicle exceptions (restriction:vehicle = none) as vehicle restrictions
      if #vehicle_none_restriction < 1 then
        -- No parking at specific times for bus lanes get their own class
        local bus_lane_cond = get_sub_condition(restriction_reason_conditional, 'bus_lane') or get_sub_condition(reason_conditional, 'bus_lane')
        if reason == 'bus_lane' or restriction_reason == 'bus_lane' then
          condition_class = add_condition_class(condition_class, 'bus_lane', cond)
        elseif bus_lane_cond then
          condition_class = add_condition_class(condition_class, 'bus_lane', bus_lane_cond)
        else
          -- Regular no_parking/standing/stopping
          condition_class = add_condition_class(condition_class, r, cond)
        end
      elseif not has_condition_class('vehicle_restriction') then -- In case of "double tagging": if there is a vehicle_restriction already, we don’t need to add it again
        -- Some vehicles like taxis have their own class
        local has_special_vehicle_access = false
        for _, vehicle in ipairs(access_restriction_class_list) do
          if is_in(vehicle, vehicle_none_restriction) then
            has_special_vehicle_access = true
            if not has_condition_class(vehicle) then
              condition_class = add_condition_class(condition_class, vehicle, cond)
            end
          end
        end
        if not has_special_vehicle_access and not has_common(vehicle_none_restriction, free_vehicle_restriction_class_list) then
          if cond then
            condition_class = add_condition_class(condition_class, 'vehicle_restriction', 'only ' .. table.concat(vehicle_none_restriction, ', ') .. ') (' .. cond)
          else
            condition_class = add_condition_class(condition_class, 'vehicle_restriction', 'only ' .. table.concat(vehicle_none_restriction, ', '))
          end
        end
      end
    end
  end

  -- Add vehicle_restriction for passenger cars separately for cases other restrictions than free parking
  if has_common(vehicle_designated, free_vehicle_restriction_class_list) and not has_condition_class('free') and not has_condition_class('assumed_free') and not has_condition_class('vehicle_restriction') then
    condition_class = add_condition_class(condition_class, 'vehicle_restriction', 'only ' .. table.concat(vehicle_designated, ', '))
  end

  -- Add vehicle exceptions (negative access restrictions like vehicle = no) at the end to prevent them from interfering with "free" class
  if vehicle_excluded and #vehicle_excluded > 0 then
    local no_vehicle = {}
    local no_vehicle_cond = {}
    local vehicle_conditional = nil
    for _, vehicle_class in ipairs(vehicle_excluded) do
      vehicle_conditional = get_sub_condition(parse_conditional_value(t(vehicle_class .. ':conditional')), 'no')
      if vehicle_conditional then
        table.insert(no_vehicle_cond, vehicle_class)
      else
        table.insert(no_vehicle, vehicle_class)
      end
    end
    if no_vehicle and #no_vehicle > 0 then
      condition_class = add_condition_class(condition_class, 'vehicle_restriction', 'no ' .. table.concat(no_vehicle, ', '))
    end
    if no_vehicle_cond and #no_vehicle_cond > 0 and vehicle_conditional then
      condition_class = add_condition_class(condition_class, 'vehicle_restriction', 'no ' .. table.concat(no_vehicle_cond, ', ') .. ') (' ..  vehicle_conditional)
    end
  end

  condition_class = subtract_time_ranges(condition_class) or condition_class
  condition_class = sort_condition_class(condition_class) or condition_class

  -- Exclude some vehicle classes from the vehicle_designated list, since they define their own restriction class and we don't need a duplicate in the designated list
  if vehicle_designated and access_restriction_class_list then
    -- Create lookup set
    local exclusion = {}
    for _, v in ipairs(access_restriction_class_list) do
      exclusion[v] = true
    end

    -- Go through the list backwards and remove unwanted elements
    for i = #vehicle_designated, 1, -1 do
      if exclusion[vehicle_designated[i]] then
        table.remove(vehicle_designated, i)
      end
    end
  end

  -- Concat vehicle conditions (transform vehicle lists to semicolon separated string)
  local vehicle_restrictions = nil
  if vehicle_designated and #vehicle_designated > 0 then
    table.sort(vehicle_designated)
    vehicle_restrictions = table.concat(vehicle_designated, SEPARATOR)
  end

  if vehicle_excluded and #vehicle_excluded > 0 then
    table.sort(vehicle_excluded)
    if vehicle_restrictions then
      vehicle_restrictions = vehicle_restrictions .. SEPARATOR .. table.concat(vehicle_excluded, SEPARATOR)
    else
      vehicle_restrictions = table.concat(vehicle_excluded, SEPARATOR)
    end
  end

  -- Replace semicolons/separators in conditions by commas, to ensure separability of classes
  -- and ensure that each comma is followed by a whitespace for consistency and better readability
  local sep = ","
  if sep == SEPARATOR then
    sep = ";"
  end
  for i, class in ipairs(condition_class) do
    local s = string.gsub(class, SEPARATOR, sep)
    condition_class[i] = string.gsub(s, ",%s*", ", ")
  end

  -- Concat condition classes (transform condition class list to semicolon separated string)
  local condition_category_str = #condition_class > 0 and table.concat(condition_class, SEPARATOR) or default_category
  -- We are only logging warning indicators, but don't export them by default
  local _warnings_str = table.concat(warnings, SEPARATOR) -- reserved for future logging

  return {
    condition_category = condition_category_str,
  }
end

return classify_parking_conditions
