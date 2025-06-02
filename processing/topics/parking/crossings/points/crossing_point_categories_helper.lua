local function has_side_value(input)
  return input == 'left' or input == 'right' or input == 'both'
end

local function check_tag_with_suffixes(tags, key, value)
  return tags[key .. ':left'] == value or
    tags[key .. ':right'] == value or
    tags[key .. ':both'] == value
end

local function remove_side_suffix(input)
  if type(input) ~= "string" then return input end
  return input:gsub(":left$", "")
              :gsub(":right$", "")
              :gsub(":both$", "")
end

return {
  has_side_value = has_side_value,
  check_tag_with_suffixes = check_tag_with_suffixes,
  remove_side_suffix = remove_side_suffix,
}
