local network_minzoom = {
  ncn = 5,
  icn = 5,
  rcn = 8,
  lcn = 9,
}

---@param result_tags table
---@return integer
local function minzoom(result_tags)
  if result_tags.cycle_highway == 'yes' then
    return 5
  end
  return network_minzoom[result_tags.network] or 10
end

return minzoom
