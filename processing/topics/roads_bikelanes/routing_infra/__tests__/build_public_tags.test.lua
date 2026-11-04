require('topics.helper.osm2pgsql')
local SANITIZE_VALUES = require('topics.helper.sanitize_values')
local build_public_tags = require('topics.roads_bikelanes.routing_infra.build_public_tags')
local build_segments = require('topics.roads_bikelanes.routing_infra.build_segments')
local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')
local resolve_motor_road_context = require('topics.roads_bikelanes.routing_infra.resolve_motor_road_context')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')

describe('build_public_tags', function()
  local line_geom = {}
  function line_geom:reverse()
    return self
  end

  -- Runs one OSM way through the same steps as `roads_bikelanes_routing_infra`.
  ---@param object_tags table
  ---@param cycleways table[]|nil
  ---@return table[]
  local function public_rows(object_tags, cycleways)
    object_tags._type = 'way'
    object_tags._id = 42
    object_tags._length = 100
    local context = {
      object_tags = object_tags,
      object_geom = line_geom,
      cycleways = cycleways or {},
      shared_result_tags = result_tags(object_tags),
    }

    local rows = {}
    for _, segment in ipairs(build_segments(context)) do
      if not inclusion_rules.exclude_segment(segment.tags) then
        local motor_context = resolve_motor_road_context(segment, context)
        table.insert(rows, build_public_tags(segment, motor_context, context))
      end
    end
    return rows
  end

  ---@param rows table[]
  ---@param source_table string
  ---@return table
  local function row_of(rows, source_table)
    for _, row in ipairs(rows) do
      if row.source_table == source_table then
        return row
      end
    end
    error('no row for ' .. source_table)
  end

  describe('carriageway edges', function()
    it('publishes the sanitized width, not the OSM value', function()
      local row = row_of(public_rows({ highway = 'residential', width = '3 m' }), 'roads')
      assert.are.equal(row.width, 3)
    end)

    it('publishes no width when the sanitizer cannot read the OSM value', function()
      local row = row_of(public_rows({ highway = 'residential', width = '5,7' }), 'roads')
      assert.is_nil(row.width)
    end)

    it('publishes the sanitized surface, not the OSM value', function()
      local row = row_of(public_rows({ highway = 'residential', surface = 'dirt' }), 'roads')
      assert.are.equal(row.surface, 'ground')
    end)

    it('publishes the smoothness derived from surface like roads does', function()
      local object_tags = { highway = 'residential', surface = 'asphalt' }
      local row = row_of(public_rows(object_tags), 'roads')
      assert.are.equal(row.smoothness, result_tags(object_tags).smoothness)
      assert.is_not_nil(row.smoothness)
    end)
  end)

  describe('path edges', function()
    it('publishes sanitized width and surface', function()
      local row = row_of(public_rows({ highway = 'path', width = '100 cm', surface = 'mud' }), 'roadsPathClasses')
      assert.are.equal(row.width, 1)
      assert.are.equal(row.surface, 'ground')
    end)
  end)

  describe('bikelane edges', function()
    local object_tags = { highway = 'residential', width = '12 m', surface = 'asphalt' }
    local lane = {
      _id = 'way/42/cycleway/right',
      _side = 'right',
      _infrastructureExists = true,
      category = 'cyclewayOnHighway_advisory',
      oneway = 'implicit_yes',
      prefix = 'cycleway',
      parent_road = 'residential',
      offset = -6,
      width = 1.5,
      surface = 'paving_stones',
      smoothness = 'good',
    }

    it('publishes the values of the lane, not of the road', function()
      local row = row_of(public_rows(object_tags, { lane }), 'bikelanes')
      assert.are.equal(row.width, 1.5)
      assert.are.equal(row.surface, 'paving_stones')
      assert.are.equal(row.smoothness, 'good')
      assert.are.equal(row.prefix, 'cycleway')
      assert.are.equal(row.parent_road, 'residential')
      assert.are.equal(row.offset, -6)
      assert.are.equal(row.oneway, 'yes')
    end)
  end)

  describe('raw OSM tags', function()
    local RAW = 'raw osm value'
    -- `name` is a free text in `roads` too: `safe_string` cleans it and keeps the text.
    local raw_keys = {
      'access_bicycle', 'adjoining_maxspeed', 'adjoining_road', 'category', 'length', 'maxspeed', 'offset',
      'oneway', 'oneway_motor', 'parent_id', 'prefix', 'road', 'side', 'smoothness', 'source_id', 'source_table',
      'surface', 'width',
    }

    local function way_with_raw_tags(highway)
      local object_tags = { highway = highway }
      for _, key in ipairs(raw_keys) do
        object_tags[key] = RAW
      end
      return object_tags
    end

    local function assert_only_sanitized_values(row)
      for key, value in pairs(row) do
        assert.are_not.equal(value, RAW, key)
        assert.are_not.equal(value, SANITIZE_VALUES.disallowed, key)
      end
    end

    it('never reach a carriageway row', function()
      local object_tags = way_with_raw_tags('residential')
      object_tags.parent_road = RAW
      assert_only_sanitized_values(row_of(public_rows(object_tags), 'roads'))
    end)

    it('never reach a path row', function()
      assert_only_sanitized_values(row_of(public_rows(way_with_raw_tags('path')), 'roadsPathClasses'))
    end)
  end)

  it('publishes a width the export can cast to numeric for every OSM variant', function()
    local variants = {
      '3', '2.5', '3 m', '3m', '100 cm', '1.5 km', '5,7', '0,5', '0.5;1', '2-3', '< 0.5', 'ca. 3',
      'narrow', '3 Meter', '6\'', '3..5', '-', '',
    }
    for _, width in ipairs(variants) do
      local row = row_of(public_rows({ highway = 'residential', width = width }), 'roads')
      assert.is_true(row.width == nil or type(row.width) == 'number', width)
    end
  end)
end)
