require('init')

--- Generic string sanitizer to remove potentially harmful characters
--- Allows: A-Z, a-z, 0-9, space, minus, underscore, and common German characters (Ä, Ö, Ü, ä, ö, ü, ß), `;`, `,`, [], (), @
--- @param value string|nil
--- @return string|nil
local function sanitize_string(value)
  if value == nil then return nil end

  -- Preserve allowed non-ASCII chars using temporary ASCII-only placeholders
  -- Without this workaround osm2pgsql does run due to utf8 errors.
  local placeholders = {
    ['Ä'] = '@@__KEEP_AE__@@',
    ['Ö'] = '@@__KEEP_OE__@@',
    ['Ü'] = '@@__KEEP_UE__@@',
    ['ä'] = '@@__KEEP_ae__@@',
    ['ö'] = '@@__KEEP_oe__@@',
    ['ü'] = '@@__KEEP_ue__@@',
    ['ß'] = '@@__KEEP_sz__@@',
  }

  for char, token in pairs(placeholders) do
    value = value:gsub(char, token)
  end

  -- Remove everything not in the ASCII whitelist (no dot to match previous behavior)
  value = value:gsub('[^%w %-%_;.,:()%[%]@/]', '')

  -- Restore placeholders back to their original characters
  for char, token in pairs(placeholders) do
    value = value:gsub(token, char)
  end

  return value
end

return sanitize_string
