require('init')
local metadata = require('metadata')
local default_id = require('default_id')
local LOG_ERROR = require('poiClassification_errors')
local poi_classification_tables = require('poi_classification_tables')
local exit_processing_poi_classification = require('exit_processing_poi_classification')
local result_tags_poi_classification = require('result_tags_poi_classification')

local table = poi_classification_tables.table

local function poi_classification_nodes(object)
  if exit_processing_poi_classification(object) then return end

  local cleaned_tags, replaced_tags = result_tags_poi_classification(object)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'poiClassification_node')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
end

return poi_classification_nodes
