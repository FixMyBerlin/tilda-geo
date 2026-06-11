local network_minzoom = {
  ncn = 8,
  icn = 8,
  rcn = 8,
  lcn = 8,
}

---@param result_tags table
---@return integer
local function minzoom(result_tags)
  if result_tags.cycle_highway == 'yes' then
    return 9
  end
  return network_minzoom[result_tags.network] or 10
end

return minzoom
