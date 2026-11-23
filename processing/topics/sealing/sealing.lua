-- Entrypoint for the `sealing` topic (a weekend topic, see constants/topics.const.ts).
-- Writes the PROCESSING-ONLY table `_sealing_surfaces`: the OSM input for the Flächenfinder
-- scoring worker, which computes the sealed share of the ground per H3 hexagon.
-- It is about surface sealing, not land use; the land use tags only approximate sealing.
-- Classification: helper/classify_sealing.lua. Table: helper/insert_sealing_surface.lua.
local sealing_nodes = require('topics.sealing.sealing_nodes')
local sealing_lines = require('topics.sealing.sealing_lines')
local sealing_areas = require('topics.sealing.sealing_areas')
local classify_sealing = require('topics.sealing.helper.classify_sealing')

function osm2pgsql.process_node(object)
  sealing_nodes(object)
end

function osm2pgsql.process_way(object)
  if object.is_closed and classify_sealing.is_area_way(object.tags) then
    sealing_areas(object)
    return
  end
  sealing_lines(object)
end

function osm2pgsql.process_relation(object)
  if object.tags.type == 'multipolygon' then
    sealing_areas(object)
  end
end
