local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.poiClassification.poiClassification_errors')
local poi_classification_tables = require('topics.poiClassification.poi_classification_tables')
local exit_processing = require('topics.poiClassification.helper.exit_processing')
local result_tags = require('topics.poiClassification.helper.result_tags')
local minzoom = require('topics.poiClassification.helper.minzoom')

local table = poi_classification_tables.table

local function poi_classification_nodes(object)
  if exit_processing(object) then return end

  local cleaned_tags, replaced_tags = result_tags(object)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'poiClassification_node')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = default_id(object),
  })
end

return poi_classification_nodes
