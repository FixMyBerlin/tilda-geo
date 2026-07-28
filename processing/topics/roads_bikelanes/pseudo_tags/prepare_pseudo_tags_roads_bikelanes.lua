local load_merged_pseudo_tags = require('topics.roads_bikelanes.pseudo_tags.load_merged_pseudo_tags')
local apply_pseudo_tags = require('topics.roads_bikelanes.pseudo_tags.apply_pseudo_tags')

local merged_data = load_merged_pseudo_tags()

local function prepare_pseudo_tags_roads_bikelanes(object_tags, object_id, object_geom)
  local merged = merged_data:get()
  apply_pseudo_tags(object_tags, object_id, merged, object_geom)
end

return prepare_pseudo_tags_roads_bikelanes
