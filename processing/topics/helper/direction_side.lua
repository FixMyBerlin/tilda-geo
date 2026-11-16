-- In right-hand traffic the lane in way direction (`forward`) lies in the right half of the way,
-- the lane against it (`backward`) in the left half.
local DIRECTION_TO_SIDE = { forward = 'right', backward = 'left' }
local SIDE_TO_DIRECTION = { right = 'forward', left = 'backward' }

---@param direction string|nil `forward` or `backward`
---@return 'right'|'left'|nil
local function direction_to_side(direction)
  return DIRECTION_TO_SIDE[direction]
end

---@param side string|nil `right` or `left`
---@return 'forward'|'backward'|nil
local function side_to_direction(side)
  return SIDE_TO_DIRECTION[side]
end

return {
  direction_to_side = direction_to_side,
  side_to_direction = side_to_direction,
}
