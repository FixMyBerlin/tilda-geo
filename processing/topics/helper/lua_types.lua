---@meta

-- Raw OSM values are strings. Processing also hangs computed internals on the same bag
-- (`_length`, `_area`, `_id`, `_timestamp`, `_is_compact_water`).
---@alias OsmTagValue string|number|boolean|nil
---@alias OsmTags table<string, OsmTagValue>

---@class OsmGeometry
---@field transform fun(self: OsmGeometry, srid: number): OsmGeometry
---@field length fun(self: OsmGeometry): number
---@field area fun(self: OsmGeometry): number
---@field srid fun(self: OsmGeometry): number
---@field is_null fun(self: OsmGeometry): boolean
---@field centroid fun(self: OsmGeometry): OsmGeometry
---@field pole_of_inaccessibility fun(self: OsmGeometry): OsmGeometry

---@class OsmObject
---@field id number
---@field type 'way'|'node'|'relation'
---@field tags OsmTags
---@field geom OsmGeometry|nil
---@field is_closed boolean|nil Ways only
---@field nodes number[]|nil Ways only
---@field members table[]|nil Relations only
---@field version number|nil
---@field timestamp number|nil Unix seconds since epoch; nil when the OSM file has no extra attributes
---@field changeset number|nil
---@field uid number|nil
---@field user string|nil
---@field as_linestring fun(self: OsmObject): OsmGeometry
---@field as_multipolygon fun(self: OsmObject): OsmGeometry
---@field as_point fun(self: OsmObject): OsmGeometry
---@field grab_tag fun(self: OsmObject, key: string): OsmTagValue

---@class Osm2pgsqlTable
---@field insert fun(self: Osm2pgsqlTable, row: table)

---@class ObjectMeta
---@field updated_at number|nil Unix seconds copied from OsmObject.timestamp
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
---@field object_geom OsmGeometry
---@field shared_result_tags SharedResultTags
---@field cycleways table[]
---@field cycleway_presence CyclewayPresence|nil

---@alias SideKey 'left'|'right'|'self'
---@alias SideFilter fun(tags: OsmTags): boolean
