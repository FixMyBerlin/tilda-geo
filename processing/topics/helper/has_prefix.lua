require('init')

local function has_prefix(str, prefix)
  if type(str) ~= "string" then
    return nil
  end
  if str == nil then
    return nil
  end
  return str:sub(1, prefix:len()) == prefix
end

return has_prefix
