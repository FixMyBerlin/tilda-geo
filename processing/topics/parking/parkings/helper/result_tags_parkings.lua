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
require("sanitize_for_logging")
require("this_or_that")
require('result_tags_value_helpers')

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

  local allowed_reasons = {
    "bus_lane", "rails", "bus_stop", "crossing", "cycleway", "driveway", "dual_carriage", "fire_lane", "junction", "loading_zone", "markings", "narrow", "passenger_loading_zone", "priority_road", "street_cleaning", "turnaround", "turn_lane", "living_street"
  }
  local allowed_access = {"yes", "no", "private", "customers", "delivery", "permissive", "permit", "residents", "designated", "unknown"}

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
    operator_type = operator_type_value(object),
    -- PARKING
    parking = parking_value(object),
    orientation = sanitize_for_logging(object.tags.orientation, {"parallel", "diagonal", "perpendicular"}),
    capacity = ParseLength(object.tags.capacity),
    markings = sanitize_for_logging(object.tags.markings, {"yes", "no"}),
    direction = sanitize_for_logging(object.tags.direction, {"back_in", "head_in"}),
    reason = sanitize_for_logging(object.tags.reason, allowed_reasons),
    staggered = sanitize_for_logging(object.tags.staggered, {"yes", "no"}),
    restriction = sanitize_for_logging(object.tags.restriction, {"no_parking", "no_stopping", "no_standing", "loading_only", "charging_only", "none"}),
    ["restriction:conditional"] = object.tags["restriction:conditional"],
    ["restriction:bus"] = object.tags["restriction:bus"],
    ["restriction:hgv"] = object.tags["restriction:hgv"],
    ["restriction:reason"] = sanitize_for_logging(object.tags["restriction:reason"], allowed_reasons),
    ["restriction:reason:conditional"] = object.tags["restriction:reason:conditional"],
    fee = sanitize_for_logging(object.tags.fee, {"yes", "no"}),
    ["fee:conditional"] = object.tags["fee:conditional"],
    charge = object.tags.charge,
    ["charge:conditional"] = object.tags["charge:conditional"],
    maxstay = object.tags.maxstay,
    ["maxstay:conditional"] = object.tags["maxstay:conditional"],
    ["maxstay:motorhome"] = object.tags["maxstay:motorhome"],
    -- ZONE
    zone = object.tags.zone,
    ["authentication:disc"] = sanitize_for_logging(object.tags["authentication:disc"], {"yes", "no"}),
    ["authentication:disc:conditional"] = object.tags["authentication:disc:conditional"],
    -- ACCESS
    access = sanitize_for_logging(object.tags.access, allowed_access),
    ["access:conditional"] = object.tags["access:conditional"],
    private = object.tags.private,
    ["private:conditional"] = object.tags["private:conditional"],
    disabled = sanitize_for_logging(object.tags.disabled, allowed_access),
    ["disabled:conditional"] = object.tags["disabled:conditional"],
    taxi = sanitize_for_logging(object.tags.taxi, allowed_access),
    ["taxi:conditional"] = object.tags["taxi:conditional"],
    motorcar = sanitize_for_logging(object.tags.motorcar, allowed_access),
    ["motorcar:conditional"] = object.tags["motorcar:conditional"],
    hgv = sanitize_for_logging(object.tags.hgv, allowed_access),
    ["hgv:conditional"] = object.tags["hgv:conditional"],
  }
  MergeTable(result_tags, specific_tags)

  local result_tags_surface = this_or_that("surface", { value = object.tags.surface, confidence = "high", source = "tag" }, { value = object._parent_tags.surface, confidence = "medium", source = "parent_highway" })
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
