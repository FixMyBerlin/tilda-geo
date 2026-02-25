
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
    assert(road_width_tags_result.value == 18)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default')
  end)

  it("applies oneway table for main roads (secondary)", function()
    local tags = { highway = "secondary", oneway = "yes" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 9)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default_and_oneway')
  end)

  it("treats implicit_yes like yes for main roads", function()
    local tags = { highway = "primary", oneway = "implicit_yes" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 12)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default_and_oneway')
  end)

  it("uses no_oneway table for main roads without oneway", function()
    local tags = { highway = "secondary", oneway = "no" }
    local road_width_tags_result = road_width_tags(tags)
    assert(road_width_tags_result.value == 14)
    assert(road_width_tags_result.confidence == 'medium')
    assert(road_width_tags_result.source == 'highway_default')
  end)

  it("primary: oneway 12, no oneway 18", function()
    assert(road_width_tags({ highway = "primary", oneway = "yes" }).value == 12)
    assert(road_width_tags({ highway = "primary" }).value == 18)
  end)

  it("tertiary: oneway 7, no oneway 10", function()
    assert(road_width_tags({ highway = "tertiary", oneway = "yes" }).value == 7)
    assert(road_width_tags({ highway = "tertiary" }).value == 10)
  end)

  it("minor roads use same width regardless of oneway", function()
    assert(road_width_tags({ highway = "residential", oneway = "yes" }).value == 8)
    assert(road_width_tags({ highway = "residential", oneway = "no" }).value == 8)
    assert(road_width_tags({ highway = "motorway_link", oneway = "yes" }).value == 9)
    assert(road_width_tags({ highway = "motorway_link", oneway = "no" }).value == 9)
    assert(road_width_tags({ highway = "residential", oneway = "yes" }).source == 'highway_default')
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
