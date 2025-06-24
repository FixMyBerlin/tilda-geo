require('init')
require("CopyTags")
require("MergeTable")
require("DefaultId")
require("Metadata")
require("ParseLength")
require("RoadClassificationRoadValue")
require("road_name")
require("Log")
require("road_width")
require("ParseLength")
require('result_tags_value_helpers')
local this_or_that = require('this_or_that')
local SANITIZE_TAGS = require('sanitize_tags')

-- EXAMPLE
-- INPUT
-- ["parking:left"] = "no",
-- ["parking:left:restriction"] = "no_stopping",
-- ["parking:right"] = "lane",
-- ["parking:right:fee"] = "no",
-- ["parking:right:markings"] = "yes",
-- ["parking:right:orientation"] = "parallel",
-- ["parking:right:restriction:conditional"] = "loading_only @ (Mo-Fr 08:00-18:00)",
--
-- LEFT
-- parent_highway = "residential",
-- parking = "no",
-- restriction = "no_stopping",
-- side = "left"
--
-- RIGHT
-- fee = "no",
-- markings = "yes",
-- orientation = "parallel",
-- parent_highway = "residential",
-- parking = "lane",
-- ["restriction:conditional"] = "loading_only @ (Mo-Fr 08:00-18:00)",
-- side = "right"

function result_tags_parkings(object)
  local id = DefaultId(object) .. "/" .. object.tags.side

  -- REMINDER: Wenever we add tags, we need to consider updating processing/topics/parking/3_merge_parkings.sql
  -- Otherwise we risk to data loss due to the mergin of lines.
  local result_tags = {}
  MergeTable(result_tags, object.tags) -- tags specified in transform_parkings()

  local width, width_confidence, width_source = road_width(object.tags)

  local specific_tags = {
    -- ROAD
    name = road_name(object.tags),
    road_width = width,
    road_width_confidence = width_confidence,
    road_width_source = width_source,
    road = RoadClassificationRoadValue(object._parent_tags),
    operator_type = SANITIZE_TAGS.operator_type(object.tags.operator_type),
    -- PARKING
    parking = parking_value(object),
    orientation = SANITIZE_TAGS.orientation(object.tags.orientation),
    capacity = ParseLength(object.tags.capacity),
    markings = SANITIZE_TAGS.markings(object.tags.markings),
    direction = SANITIZE_TAGS.direction(object.tags.direction),
    reason = SANITIZE_TAGS.reason(object.tags.reason),
    staggered = SANITIZE_TAGS.staggered(object.tags.staggered),
    restriction = SANITIZE_TAGS.restriction(object.tags.restriction),
    ["restriction:conditional"] = object.tags["restriction:conditional"],
    ["restriction:bus"] = object.tags["restriction:bus"],
    ["restriction:hgv"] = object.tags["restriction:hgv"],
    ["restriction:reason"] = SANITIZE_TAGS.reason(object.tags["restriction:reason"]),
    ["restriction:reason:conditional"] = object.tags["restriction:reason:conditional"],
    fee = SANITIZE_TAGS.fee(object.tags.fee),
    ["fee:conditional"] = object.tags["fee:conditional"],
    charge = object.tags.charge,
    ["charge:conditional"] = object.tags["charge:conditional"],
    maxstay = object.tags.maxstay,
    ["maxstay:conditional"] = object.tags["maxstay:conditional"],
    ["maxstay:motorhome"] = object.tags["maxstay:motorhome"],
    -- ZONE
    zone = object.tags.zone,
    ["authentication:disc"] = SANITIZE_TAGS.authentication_disc(object.tags["authentication:disc"]),
    ["authentication:disc:conditional"] = object.tags["authentication:disc:conditional"],
    -- ACCESS
    access = SANITIZE_TAGS.access(object.tags.access),
    ["access:conditional"] = object.tags["access:conditional"],
    private = object.tags.private,
    ["private:conditional"] = object.tags["private:conditional"],
    disabled = SANITIZE_TAGS.disabled(object.tags.disabled),
    ["disabled:conditional"] = object.tags["disabled:conditional"],
    taxi = SANITIZE_TAGS.taxi(object.tags.taxi),
    ["taxi:conditional"] = object.tags["taxi:conditional"],
    motorcar = SANITIZE_TAGS.motorcar(object.tags.motorcar),
    ["motorcar:conditional"] = object.tags["motorcar:conditional"],
    hgv = SANITIZE_TAGS.hgv(object.tags.hgv),
    ["hgv:conditional"] = object.tags["hgv:conditional"],
  }
  MergeTable(result_tags, specific_tags)

  local result_tags_surface = this_or_that(
    "surface",
    { value = SANITIZE_TAGS.surface(object.tags.surface), confidence = "high", source = "tag" },
    { value = SANITIZE_TAGS.surface(object._parent_tags.surface), confidence = "medium", source = "parent_highway" }
  )
  MergeTable(result_tags, result_tags_surface)

  local tags_cc = {
    "mapillary",
    "panoramax",
    "panoramax:0",
    "panoramax:1",
    "panoramax:2",
    "panoramax:3",
  }
  CopyTags(result_tags, object._parent_tags, tags_cc, "osm_")
  CopyTags(result_tags, object.tags, tags_cc, "osm_")

  local result_meta = Metadata(object)
  result_meta.updated_age = nil -- Lets start without this because it adds work and might not be needed

  return {
    id = id,
    side = object.tags.side,
    tags = result_tags,
    meta = result_meta,
  }
end
