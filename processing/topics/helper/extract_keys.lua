local function extract_keys(list)
  local set = {}
  for key, _ in pairs(list) do table.insert(set, key) end
  return set
end

return extract_keys
