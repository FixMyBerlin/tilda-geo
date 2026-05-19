require('init')
--- Define the OSM object type used by osm2pgsql

---@class OSMObject
---@field id number The unique identifier of the object
---@field type ''way''|''node''|''relation'' The type of the object
---@field tags table<string, string> A table of key-value pairs representing tags
---@field geom any The geometry of the object

OSMObject = {}
