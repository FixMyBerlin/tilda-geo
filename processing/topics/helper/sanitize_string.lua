
--- Generic string sanitizer with minimal data loss:
--- - Removes control characters (including NUL) to avoid parser/log issues.
--- - Neutralizes `<` and `>` to reduce HTML/script injection risk in downstream renderers.
--- - Preserves all other characters as-is (including unicode and punctuation).
---@param value string|nil
---@return string|nil
local function sanitize_string(value)
  if value == nil then return nil end

  -- Keep newlines/tabs; remove other ASCII control chars.
  value = value:gsub('[%z\1-\8\11\12\14-\31\127]', '')
  -- Neutralize HTML/XML-like tags while keeping plain comparisons unchanged.
  -- Examples:
  -- - "<script>alert(1)</script>" -> "(script)alert(1)(/script)"
  -- - "foo > bar" stays unchanged
  value = value:gsub('<%s*/?%s*[%a][^>]->', function(tag)
    tag = tag:gsub('<', '(')
    tag = tag:gsub('>', ')')
    return tag
  end)

  return value
end

return sanitize_string
