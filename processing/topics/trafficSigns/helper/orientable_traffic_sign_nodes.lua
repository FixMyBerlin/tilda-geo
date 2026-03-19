require('init')

local orientable_traffic_sign_nodes = {}

local ORIENTABLE_TRAFFIC_SIGN_NODES = {
  mark_for_orientation = function(node_id)
    orientable_traffic_sign_nodes[node_id] = true
  end,
  needs_orientation = function(node_id)
    return orientable_traffic_sign_nodes[node_id]
  end,
}

return ORIENTABLE_TRAFFIC_SIGN_NODES
