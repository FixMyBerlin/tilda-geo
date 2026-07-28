---@meta

---@alias OsmTagValue string|nil
---@alias OsmTags table<string, OsmTagValue>

---@class ObjectMeta
---@field updated_at string|nil
---@field updated_by string|nil
---@field changeset_id number|nil

---@class SharedResultTags

---@class CyclewayPresence
---@field bikelane_left string|nil
---@field bikelane_right string|nil
---@field bikelane_self string|nil

---@class BikelaneState
---@field cycleways table[]
---@field cycleway_presence CyclewayPresence|nil

---@class RoadsBikelanesWayContext
---@field object_meta ObjectMeta
---@field object_tags OsmTags
---@field object_geom table
---@field shared_result_tags SharedResultTags
---@field cycleways table[]
---@field cycleway_presence CyclewayPresence|nil

---@alias SideKey 'left'|'right'|'self'
---@alias SideFilter fun(tags: OsmTags): boolean

return {}
