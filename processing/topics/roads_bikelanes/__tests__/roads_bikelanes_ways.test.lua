require('topics.helper.osm2pgsql')

-- Fake tables and fake external steps (pseudo tags read CSV files, the sidepath source table needs
-- osm2pgsql.define_table). Everything else of the way pipeline is the real code.
local table_names = {
  'roads', 'roadsPathClasses', 'bikelanes', 'bikelanesPresence', 'bikeSuitability', 'routing',
  'todos_lines', 'highwayAreas',
}
local rows = {}
local function fake_table(name)
  return {
    insert = function(_, row)
      table.insert(rows[name], row)
    end,
  }
end
package.loaded['topics.roads_bikelanes.roads_bikelanes_tables'] = {
  roads_table = fake_table('roads'),
  roads_path_classes_table = fake_table('roadsPathClasses'),
  bikelanes_table = fake_table('bikelanes'),
  bikelanes_presence_table = fake_table('bikelanesPresence'),
  bike_suitability_table = fake_table('bikeSuitability'),
  routing_infra_table = fake_table('routing'),
  todo_lines_table = fake_table('todos_lines'),
  highway_areas_table = fake_table('highwayAreas'),
}

local logged_errors = {}
package.loaded['topics.roads_bikelanes.roads_bikelanes_errors'] = {
  SANITIZED_VALUE = function(object_type, object_id, _geom, tags, caller_name)
    table.insert(logged_errors, { object_type = object_type, object_id = object_id, tags = tags, caller_name = caller_name })
  end,
}

local sidepath_calls = 0
package.loaded['topics.roads_bikelanes.pseudo_tags_sidepath.roads_bikelanes_sidepath_source_paths'] = function()
  sidepath_calls = sidepath_calls + 1
end
package.loaded['topics.roads_bikelanes.pseudo_tags.prepare_pseudo_tags_roads_bikelanes'] = function() end

local process_roads_bikelanes_way = require('topics.roads_bikelanes.roads_bikelanes_ways')

describe('process_roads_bikelanes_way and access restrictions', function()
  local geom = {}
  function geom:transform() return self end
  function geom:length() return 120 end
  function geom:reverse() return { reversed = true } end

  ---@param tags table
  local function run(tags)
    for _, name in ipairs(table_names) do rows[name] = {} end
    sidepath_calls = 0
    logged_errors = {}
    process_roads_bikelanes_way({
      type = 'way',
      id = 7,
      tags = tags,
      timestamp = 1,
      user = 'u',
      changeset = 2,
      as_linestring = function() return geom end,
    })
  end

  ---@param except string[]|nil
  local function assert_empty_except(except)
    local skip = {}
    for _, name in ipairs(except or {}) do skip[name] = true end
    for _, name in ipairs(table_names) do
      if not skip[name] then assert.are.equal(0, #rows[name], name) end
    end
  end

  describe('public ways', function()
    it('write the carriageway edge to routing and a roads row', function()
      run({ highway = 'residential', name = 'Weg' })
      assert.are.equal(1, #rows.routing)
      assert.are.equal(1, #rows.roads)
      assert.is_nil(rows.routing[1].tags.access_bicycle)
    end)
  end)

  describe('in no table, without a hint of bike infrastructure', function()
    it('writes nothing', function()
      run({ highway = 'service', service = 'driveway', name = 'Zufahrt', surface = 'asphalt' })
      assert_empty_except({})
      assert.are.equal(0, sidepath_calls)
    end)

    it('does not compute the geometry', function()
      local touched = false
      for _, name in ipairs(table_names) do rows[name] = {} end
      process_roads_bikelanes_way({
        type = 'way',
        id = 8,
        tags = { highway = 'service', service = 'driveway' },
        as_linestring = function()
          touched = true
          return geom
        end,
      })
      assert.is_false(touched)
    end)
  end)

  describe('construction: prefix', function()
    it('is applied before the restriction: construction:access=private is private and written nowhere', function()
      run({ highway = 'residential', ['construction:access'] = 'private' })
      assert_empty_except({})
    end)

    it('is applied before the hint: a driveway with construction:cycleway keeps its bikelane', function()
      run({ highway = 'service', service = 'driveway', ['construction:cycleway:right'] = 'lane' })
      assert.are.equal(1, #rows.bikelanes)
      assert.are.equal('construction', rows.bikelanes[1].tags.lifecycle)
    end)
  end)

  describe('in no table, with a hint but no bike infrastructure', function()
    it('writes nothing', function()
      run({ highway = 'service', service = 'driveway', name = 'Zufahrt', ['cycleway:both'] = 'no' })
      assert_empty_except({})
      assert.are.equal(0, sidepath_calls)
    end)

    it('logs no sanitizer error to the public errors table', function()
      run({
        highway = 'service',
        service = 'driveway',
        ['cycleway:both'] = 'no',
        ['cycleway:both:surface:colour'] = 'purple',
        surface = 'unknown_surface',
      })
      assert.are.same({}, logged_errors)
    end)
  end)

  describe('public ways with bike infrastructure', function()
    it('log the bikelane sanitizer errors once, from the bikelanes writer', function()
      run({ highway = 'residential', ['cycleway:right'] = 'track', ['cycleway:right:surface:colour'] = 'purple' })
      local bikelane_errors = {}
      for _, logged in ipairs(logged_errors) do
        if logged.caller_name == 'bikelanes' then table.insert(bikelane_errors, logged) end
      end
      assert.are.equal(1, #bikelane_errors)
      assert.are.equal('purple', bikelane_errors[1].tags.surface_color)
      assert.are.equal(7, bikelane_errors[1].object_id)
    end)
  end)

  describe('in all tables through own bike infrastructure', function()
    it('is public: roads, bikelanes and routing rows', function()
      run({ highway = 'service', service = 'driveway', traffic_sign = 'DE:240' })
      assert.are.equal(1, #rows.roads)
      assert.are.equal(1, #rows.bikelanes)
      assert.are.equal(1, #rows.routing)
      assert.are.equal(1, sidepath_calls)
    end)
  end)

  describe('bicycle access that does not allow cycling', function()
    it('vehicle=destination keeps the roads row and the routing edge, flagged with access_bicycle', function()
      run({ highway = 'residential', vehicle = 'destination', name = 'Weg', ['cycleway:right'] = 'lane' })
      assert.are.equal(1, #rows.roads)
      assert.are.equal(1, #rows.bikelanes)
      assert.are.equal(2, #rows.routing)
      local edges = {}
      for _, row in ipairs(rows.routing) do edges[row.tags.source_table] = row end
      assert.are.equal('destination', edges.roads.tags.access_bicycle)
      assert.are.equal('way/7', edges.roads.id)
      assert.are.equal('mixedTrafficMotor', edges.roads.tags.category)
      -- the lane is where cycling is meant to happen, it does not inherit the carriageway access
      assert.is_nil(edges.bikelanes.tags.access_bicycle)
      assert.is_nil(rows.roads[1].tags.access_bicycle)
    end)

    it('bicycle=no on a primary road keeps the roads row and the routing edge', function()
      run({ highway = 'primary', bicycle = 'no', name = 'Heerstraße' })
      assert.are.equal(1, #rows.roads)
      assert.are.equal(1, #rows.routing)
      assert.are.equal('no', rows.routing[1].tags.access_bicycle)
      assert.are.equal('roads', rows.routing[1].tags.source_table)
    end)

    it('vehicle=private keeps the routing edge', function()
      run({ highway = 'residential', vehicle = 'private' })
      assert.are.equal(1, #rows.roads)
      assert.are.equal('private', rows.routing[1].tags.access_bicycle)
    end)

    it('motorway and trunk have no routing edge', function()
      run({ highway = 'trunk', bicycle = 'no' })
      assert.are.equal(0, #rows.routing)
    end)
  end)

  describe('only in bikelanes', function()
    it('access=destination without bike permission: no roads row, no carriageway edge, the bikelane stays', function()
      run({ highway = 'residential', access = 'destination', name = 'Weg', ['cycleway:right'] = 'lane' })
      assert.are.equal(0, #rows.roads)
      assert.are.equal(1, #rows.bikelanes)
      assert.are.equal(1, #rows.routing)
      assert.are.equal('bikelanes', rows.routing[1].tags.source_table)
    end)

    it('indoor=yes footway: no roadsPathClasses row and no path edge', function()
      run({ highway = 'footway', indoor = 'yes', name = 'Halle' })
      assert_empty_except({})
    end)

    it('Radieschenpfad: access=destination with bicycle=yes is public, the edge is flagged yes', function()
      run({ highway = 'path', access = 'destination', bicycle = 'yes', name = 'Radieschenpfad' })
      assert.are.equal(1, #rows.roadsPathClasses)
      assert.are.equal(1, #rows.routing)
      assert.are.equal('bikelanes', rows.routing[1].tags.source_table) -- bicycle=yes on a path is a shared way
      assert.are.equal('yes', rows.routing[1].tags.access_bicycle)
    end)
  end)

  describe('in no table by access tag', function()
    it('access=private is written nowhere', function()
      run({ highway = 'residential', access = 'private', name = 'Weg' })
      assert_empty_except({})
    end)
  end)
end)
