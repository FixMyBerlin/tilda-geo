
describe("road_width_tags", function()
  local road_width_tags = require("road_width_tags")
  require("osm2pgsql")

  it("returns fallback width for unknown highway types", function()
    local tags = { highway = "unknown" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 10)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default')
  end)

  it("returns specific width for known highway types", function()
    local tags = { highway = "primary" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 17)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default')
  end)

  it("applies oneway logic correctly", function()
    local tags = { highway = "secondary", oneway = "yes" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 15 * 2/3) -- = 10
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default_and_oneway')
  end)

  it("ignores oneway logic for non-oneway roads", function()
    local tags = { highway = "secondary", oneway = "no" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 15)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default')
  end)

  it("handles missing highway tag gracefully", function()
    local tags = {}
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 10)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default')
  end)

  it("returns high confidence and tag source when tags.width is present", function()
    local tags = { width = "12.5", highway = "primary" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 12.5)
    assert(road_width_tags_result.confidence == 'high')
    assert(road_width_tags_result.source == 'tag')
  end)
end)
