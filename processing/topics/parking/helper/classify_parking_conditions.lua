require('init')
require('Log')
local normalize_separated_values = require('normalize_separated_values')

-- Helper function to trim whitespace
local function trim(str)
  return str:match("^%s*(.-)%s*$")
end

local SEPARATOR = ';'

-- Parse conditional value in format 'value @ (condition)'
-- Examples: 'loading_only @ (Mo-Fr 08:00-18:00)', 'no @ (Mo-Fr 06:00-22:00)'
---@param value string|nil The conditional value string to parse
---@return {value: string, condition: string}|nil Parsed conditional value with value and condition parts, or nil if invalid
function parse_conditional_value(value)
  if not value or type(value) ~= 'string' then
    return nil
  end

  -- Match pattern: 'value @ (condition)' with flexible whitespace
  local value_part, condition_part = value:match("^%s*(.-)%s+@%s+%((.-)%)%s*$")

  if value_part and condition_part then
    return {
      value = trim(value_part),
      condition = trim(condition_part)
    }
  end

  return nil
end

-- Helper function to check if a value is empty or 'no' or 'none'
---@param value string|nil The value to check
---@return boolean True if value is empty, 'no', or 'none'
local function is_empty_or_no(value)
  return not value or value == '' or value == 'no' or value == 'none'
end

-- Helper function to check if a value is not empty and not 'no' or 'none'
---@param value string|nil The value to check
---@return boolean True if value is not empty and not 'no' or 'none'
local function is_not_empty_or_no(value)
  return value ~= nil and value ~= '' and value ~= 'no' and value ~= 'none'
end

-- Classify parking conditions into merged categories
-- Based on [street_parking.py](https://github.com/SupaplexOSM/street_parking.py/blob/main/street_parking.py) vehicle restrictions processing
---@param tags table<string, string|nil> Object containing OSM tags with parking-related information
---@param default_category 'assumed_free'|'private' Default category to use when no condition is found
---@return {condition_category?: 'assumed_free'|'residents'|'free'|'paid'|'loading'|'charging'|'disabled_private'|'time_limited'|'vehicle_restriction'|'access_restriction'|'no_parking'|'no_standing'|'no_stopping'|'private', condition_vehicles?: string}
function classify_parking_conditions(tags, default_category)
  -- Initialize categories
  local condition_class = nil
  local vehicle_designated = nil
  local vehicle_excluded = nil

  -- Get base values
  local fee = tags.fee
  local fee_conditional = tags['fee:conditional']
  local access = tags.access
  local access_conditional = tags['access:conditional']
  local maxstay = tags.maxstay
  local maxstay_conditional = tags['maxstay:conditional']
  local restriction = tags.restriction
  local restriction_conditional = tags['restriction:conditional']
  local zone = tags.zone

  -- Vehicle class list (matching Python street_parking.py)
  local vehicle_class_list = {'motorcar', 'disabled', 'bus', 'taxi', 'psv', 'hgv', 'goods', 'car_sharing', 'emergency', 'motorhome'}
  local access_restriction_class_list = {'disabled', 'taxi', 'psv', 'car_sharing', 'emergency'}

  -- Process vehicle restrictions (matching Python street_parking.py logic)
  local vehicle_none_restriction = {}

  for _, vehicle_class in ipairs(vehicle_class_list) do
    local vehicle = tags[vehicle_class]
    local vehicle_conditional = tags[vehicle_class .. ':conditional']
    local restriction_vehicle = tags['restriction:' .. vehicle_class]
    local restriction_vehicle_conditional = tags['restriction:' .. vehicle_class .. ':conditional']

    -- Check for "none" restrictions (vehicle is allowed)
    if restriction_vehicle == 'none' or (restriction_vehicle_conditional and restriction_vehicle_conditional:find('none')) then
      table.insert(vehicle_none_restriction, vehicle_class)
    end

    -- Check for designated vehicles (vehicle is allowed)
    if vehicle == 'designated' or vehicle == 'yes' or restriction_vehicle == 'none' then
      if vehicle_designated then
        vehicle_designated = vehicle_designated .. SEPARATOR .. vehicle_class
      else
        vehicle_designated = vehicle_class
      end
    end

    -- Check for excluded vehicles (vehicle is not allowed)
    if vehicle == 'no' then
      if vehicle_excluded then
        vehicle_excluded = vehicle_excluded .. SEPARATOR .. vehicle_class
      else
        vehicle_excluded = vehicle_class
      end
    end

    -- Process conditional vehicle restrictions
    if vehicle_conditional then
      local parsed = parse_conditional_value(vehicle_conditional)
      if parsed then
        local vehicle_value = parsed.value
        if vehicle_value == 'designated' or vehicle_value == 'yes' then
          if vehicle_designated then
            vehicle_designated = vehicle_designated .. SEPARATOR .. vehicle_class
          else
            vehicle_designated = vehicle_class
          end
        elseif vehicle_value == 'no' then
          if vehicle_excluded then
            vehicle_excluded = vehicle_excluded .. SEPARATOR .. vehicle_class
          else
            vehicle_excluded = vehicle_class
          end
        end
      end
    end

    -- Process conditional restriction vehicle exceptions
    if restriction_vehicle_conditional then
      local parsed = parse_conditional_value(restriction_vehicle_conditional)
      if parsed and parsed.value == 'none' then
        if vehicle_designated then
          vehicle_designated = vehicle_designated .. SEPARATOR .. vehicle_class
        else
          vehicle_designated = vehicle_class
        end
      end
    end
  end

  -- Helper function to add condition class
  ---@param current_class string|nil Current condition class string
  ---@param new_class string New condition class to add
  ---@param condition string|nil Optional condition string
  ---@return string Combined condition class string
  local function add_condition_class(current_class, new_class, condition)
    local condition_suffix = ''
    if condition and condition ~= '' then
      condition_suffix = ' (' .. condition .. ')'
    end
    if not current_class or current_class == '' then
      return new_class .. condition_suffix
    else
      return current_class .. SEPARATOR .. new_class .. condition_suffix
    end
  end

  -- Helper function to get sub-condition
  ---@param conditional_value string|nil Conditional value string to parse
  ---@param target_values string[] Array of target values to match against
  ---@return string|nil Condition string if match found, nil otherwise
  local function get_sub_condition(conditional_value, target_values)
    if not conditional_value then return nil end

    local parsed = parse_conditional_value(conditional_value)
    if parsed then
      for _, target_value in ipairs(target_values) do
        if parsed.value == target_value then
          return parsed.condition
        end
      end
    end
    return nil
  end

  -- Fee conditions (matching Python logic)
  local fee_cond = get_sub_condition(fee_conditional, {'yes'})
  if fee == 'yes' or fee_cond then
    condition_class = add_condition_class(condition_class, 'paid', fee_cond)
  end

  -- Residential parking only: private access and residential zone (matching Python logic)
  local private_cond = get_sub_condition(access_conditional, {'private'})
  if (access == 'private' or private_cond) and is_not_empty_or_no(zone) then
    condition_class = add_condition_class(condition_class, 'residents', private_cond)
  end

  -- Free parking (unmanaged parking: no fee or maxstay, no residential zone) (matching Python logic)
  local no_fee_cond = get_sub_condition(fee_conditional, {'no'})
  if (fee == 'no' or no_fee_cond)
    and is_empty_or_no(maxstay)
    and (access == '' or access == 'yes' or access == 'destination' or access == 'designated' or access == 'permissive' or vehicle_designated or #vehicle_none_restriction > 0)
    and is_empty_or_no(zone)
    and (is_empty_or_no(restriction) or #vehicle_none_restriction > 0)
  then
    if condition_class ~= 'residents' and condition_class ~= 'paid' then
      condition_class = add_condition_class(condition_class, 'free', '')
    end
  end

  -- Loading zone (matching Python logic)
  local loading_cond = get_sub_condition(restriction_conditional, {'loading_only'})
  if restriction == 'loading_only' or loading_cond then
    condition_class = add_condition_class(condition_class, 'loading', loading_cond)
  end

  -- Charging (matching Python logic)
  local charging_cond = get_sub_condition(restriction_conditional, {'charging_only'})
  if restriction == 'charging_only' or charging_cond then
    condition_class = add_condition_class(condition_class, 'charging', charging_cond)
  end

  -- Private disabled parking (matching Python logic)
  local disabled_conditional = tags['disabled:conditional']
  local private_disabled_cond = get_sub_condition(disabled_conditional, {'private'})
  if (access == 'no' and tags.disabled == 'private') or
     (access_conditional and access_conditional:find('no') and private_disabled_cond)
  then
    condition_class = add_condition_class(condition_class, 'disabled_private', private_disabled_cond)
  end

  -- Time limited parking: maxstay (matching Python logic)
  if maxstay_conditional and maxstay_conditional ~= '' then
    local maxstay_interval = get_sub_condition(maxstay_conditional, {''})
    condition_class = add_condition_class(condition_class, 'time_limited', maxstay_interval)
  elseif maxstay and maxstay ~= '' and maxstay ~= 'no' and maxstay ~= 'none' then
    condition_class = add_condition_class(condition_class, 'time_limited', '')
  end

  -- Vehicle restrictions and public disabled, taxi or car sharing (matching Python logic)
  if vehicle_designated and (access == 'no' or (access_conditional and access_conditional:find('no')) or #vehicle_none_restriction > 0) then
    -- Disabled, taxi and car_sharing have their own class
    for _, vehicle in ipairs({'disabled', 'taxi', 'car_sharing'}) do
      if vehicle_designated:find(vehicle) then
        condition_class = add_condition_class(condition_class, vehicle, '')
      end
    end
    -- "vehicle_restriction" is just for some "public" vehicle categories
    local has_access_restriction = false
    for _, access_restriction in ipairs(access_restriction_class_list) do
      if vehicle_designated:find(access_restriction) then
        has_access_restriction = true
        break
      end
    end
    if not has_access_restriction then
      condition_class = add_condition_class(condition_class, 'vehicle_restriction', '')
    end
  end

  -- Access restriction (matching Python logic)
  local access_cond = get_sub_condition(access_conditional, {''})
  if ((access and access ~= '' and access ~= 'yes' and access ~= 'destination' and access ~= 'designated' and access ~= 'permissive') or access_cond)
    and not (condition_class and condition_class:find('disabled'))
    and not (condition_class and condition_class:find('taxi'))
    and not (condition_class and condition_class:find('car_sharing'))
    and not (condition_class and condition_class:find('disabled_private'))
    and not (condition_class and condition_class:find('residents'))
    and not (condition_class and condition_class:find('vehicle_restriction'))
    and not (condition_class and condition_class:find('loading'))
    and not (condition_class and condition_class:find('charging'))
    and not (condition_class and condition_class:find('paid'))
    and not (condition_class and condition_class:find('free'))
    and not (condition_class and condition_class:find('time_limited'))
    and not (condition_class and condition_class:find('no_parking'))
    and not (condition_class and condition_class:find('no_standing'))
    and not (condition_class and condition_class:find('no_stopping'))
  then
    condition_class = add_condition_class(condition_class, 'access_restriction', access_cond)
  end

  -- Temporary no parking (matching Python logic)
  local no_parking_cond = get_sub_condition(restriction_conditional, {'no_parking'})
  if (restriction and restriction:find('no_parking') or no_parking_cond) and #vehicle_none_restriction < 1 then
    condition_class = add_condition_class(condition_class, 'no_parking', no_parking_cond)
  end

  -- Temporary no standing (matching Python logic)
  local no_standing_cond = get_sub_condition(restriction_conditional, {'no_standing'})
  if (restriction and restriction:find('no_standing') or no_standing_cond) and #vehicle_none_restriction < 1 then
    condition_class = add_condition_class(condition_class, 'no_standing', no_standing_cond)
  end

  -- Temporary no stopping (matching Python logic)
  local no_stopping_cond = get_sub_condition(restriction_conditional, {'no_stopping'})
  if (restriction and restriction:find('no_stopping') or no_stopping_cond) and #vehicle_none_restriction < 1 then
    condition_class = add_condition_class(condition_class, 'no_stopping', no_stopping_cond)
  end

  local vehicle_restrictions = normalize_separated_values((vehicle_designated or '') .. SEPARATOR .. (vehicle_excluded or ''), SEPARATOR)

  return {
    condition_category = condition_class or default_category,
    condition_vehicles = vehicle_restrictions,
  }
end

return {
  classify_parking_conditions = classify_parking_conditions,
  parse_conditional_value = parse_conditional_value -- exported for use in tests
}
