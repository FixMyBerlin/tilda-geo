require('init')
require('Sanitize')

-- Helper transform `direction` tags to our left|right|both schema.
-- If no `direction=*` is found, we assume `both`.
-- Some tags use a completely different approach to specify left/right with a additional tag `direction=forward|backward|both`.
-- We transform those tags to be able to use our standard `tag=left|right|both` transformation so we can treat all objects the same.
function transform_point_direction_tags(source_dest, key)
  local has_direction_key = (source_dest.direction and true) or false
  local valid_direciton_key = Sanitize(source_dest.direction, {'forward', 'backward', 'both'})
  if not has_direction_key or (has_direction_key and valid_direciton_key) then
    local direction_key = valid_direciton_key or 'both'
    local side = (direction_key == 'forward' and 'right') or (direction_key == 'backward' and 'left') or 'both'
    -- This is defined as `side_key = '_side_key_traffic_calming'`
    source_dest[key] = side
    -- We keep the original keys for now…
    -- source_dest[key] = nil
    -- source_dest.direction = nil
  end
end
