require('topics.helper.osm2pgsql')

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
  bike_suitability_table = fake_table('bikeSuitability'),
  todo_lines_table = fake_table('todos_lines'),
}

local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')
local roads_bikelanes_roads = require('topics.roads_bikelanes.roads_bikelanes_roads')

describe('roads_bikelanes_roads', function()
  ---@param object_tags table
  ---@return table[] cycleways
  local function run(object_tags)
    rows.roads, rows.roadsPathClasses, rows.bikeSuitability, rows.todos_lines = {}, {}, {}, {}
    object_tags._type = 'way'
    object_tags._id = 42
    object_tags._length = 100
    local object_geom = {}
    local cycleways = bikelanes(object_tags, object_geom)
    roads_bikelanes_roads({
      object_meta = {},
      object_tags = object_tags,
      object_geom = object_geom,
      shared_result_tags = result_tags(object_tags),
      cycleways = cycleways,
    })
    return cycleways
  end

  local function self_row(cycleways)
    for _, cycleway in ipairs(cycleways) do
      if cycleway._side == 'self' then return cycleway end
    end
    error('no self row')
  end

  describe('`unusual_width` todo', function()
    it('is left to bikelanes when the self row has it', function()
      local cycleways = run({ highway = 'cycleway', width = '0' })
      assert.are.equal(self_row(cycleways)._todo_list.unusual_width, 'prio2')
      assert.are.equal(#rows.todos_lines, 0)
    end)

    it('stays on the path when the self row reads another width', function()
      local cycleways = run({ highway = 'path', bicycle = 'designated', width = 'narrow', ['cycleway:width'] = '2' })
      assert.is_nil(self_row(cycleways)._todo_list.unusual_width)
      assert.are.equal(rows.todos_lines[1].tags.unusual_width, 'prio2')
    end)

    it('stays on a road next to lanes', function()
      run({ highway = 'residential', width = '0', ['cycleway:right'] = 'lane', ['cycleway:right:width'] = '1.5' })
      assert.are.equal(rows.todos_lines[1].tags.unusual_width, 'prio2')
    end)
  end)

  describe('directional surface', function()
    it('keeps `surface` and adds a hint for `surface:bicycle`', function()
      run({ highway = 'residential', surface = 'sett', ['surface:bicycle'] = 'asphalt' })
      local tags = rows.roads[1].tags
      assert.are.equal(tags.surface, 'sett')
      assert.are.equal(tags.surface_source, 'tag')
      assert.are.equal(tags.description, 'TILDA_surface_bicycle=asphalt')
    end)

    it('adds a hint per direction and keeps the user description', function()
      run({ highway = 'residential', surface = 'asphalt', ['surface:bicycle:forward'] = 'sett', description = 'Baustelle' })
      assert.are.equal(rows.roads[1].tags.description,
        'TILDA_surface_bicycle_right=sett;OSM-`description`: Baustelle')
    end)

    it('takes the worse value without `surface`', function()
      run({ highway = 'residential', ['surface:forward'] = 'asphalt', ['surface:backward'] = 'sett' })
      local tags = rows.roads[1].tags
      assert.are.equal(tags.surface, 'sett')
      assert.are.equal(tags.surface_source, 'tag_directional')
      assert.are.equal(tags.smoothness, 'bad')
      assert.are.equal(tags.description, 'TILDA_surface_right=asphalt')
    end)

    it('adds a hint for a side value', function()
      run({ highway = 'residential', surface = 'sett', ['surface:right'] = 'asphalt' })
      assert.are.equal(rows.roads[1].tags.description,
        'TILDA_surface_right=asphalt')
    end)

    -- https://www.openstreetmap.org/way/840977557
    it('reads `surface:bicycle` on the bikelane of a Fahrradstraße and keeps `surface` on the road', function()
      local cycleways = run({
        highway = 'residential', bicycle_road = 'yes', traffic_sign = 'DE:244.1', oneway = 'yes',
        surface = 'sett', ['sett:length'] = '0.15', smoothness = 'bad',
        ['surface:bicycle'] = 'asphalt', ['smoothness:bicycle'] = 'good',
      })
      local bikelane = self_row(cycleways)
      assert.are.equal(bikelane.surface, 'asphalt')
      assert.are.equal(bikelane.smoothness, 'good')
      assert.are.equal(bikelane.description,
        'TILDA_surface_strip=large_sett;TILDA_smoothness_strip=bad')
      assert.are.equal(rows.roads[1].tags.surface, 'large_sett')
      assert.are.equal(rows.roads[1].tags.smoothness, 'bad')
    end)

    it('derives the bikelane smoothness from `surface:bicycle` without `smoothness:bicycle`', function()
      local cycleways = run({
        highway = 'residential', bicycle_road = 'yes', traffic_sign = 'DE:244.1',
        surface = 'sett', smoothness = 'bad', ['surface:bicycle'] = 'asphalt',
      })
      assert.are.equal(self_row(cycleways).smoothness, 'good')
    end)

    -- https://www.openstreetmap.org/way/4692264
    it('reads `surface:bicycle` of the road on a Schutzstreifen without own surface', function()
      local cycleways = run({
        highway = 'residential', surface = 'sett', ['surface:bicycle'] = 'asphalt',
        ['cycleway:right'] = 'lane', ['cycleway:right:lane'] = 'advisory',
      })
      local lane
      for _, cycleway in ipairs(cycleways) do
        if cycleway._side == 'right' then lane = cycleway end
      end
      assert.are.equal(lane.category, 'cyclewayOnHighway_advisory')
      assert.are.equal(lane.surface, 'asphalt')
      assert.is_nil(lane.description)
    end)

    it('prefers `cycleway:<side>:surface` on a Schutzstreifen', function()
      local cycleways = run({
        highway = 'residential', surface = 'sett', ['surface:bicycle'] = 'asphalt',
        ['cycleway:right'] = 'lane', ['cycleway:right:lane'] = 'advisory', ['cycleway:right:surface'] = 'concrete',
      })
      for _, cycleway in ipairs(cycleways) do
        if cycleway._side == 'right' then assert.are.equal(cycleway.surface, 'concrete') end
      end
    end)

    it('reads `surface:bicycle` on a segregated path without a hint', function()
      local cycleways = run({
        highway = 'path', bicycle = 'designated', foot = 'designated', segregated = 'yes',
        traffic_sign = 'DE:241-30', surface = 'paving_stones', ['surface:bicycle'] = 'asphalt',
      })
      local bikelane = self_row(cycleways)
      assert.are.equal(bikelane.surface, 'asphalt')
      assert.is_nil(bikelane.description)
    end)

    -- https://www.openstreetmap.org/way/4475759
    it('adds a side hint on a shared path', function()
      local cycleways = run({
        highway = 'path', bicycle = 'designated', foot = 'designated', segregated = 'no',
        surface = 'paving_stones', ['surface:left'] = 'asphalt', ['surface:right'] = 'paving_stones',
      })
      local bikelane = self_row(cycleways)
      assert.are.equal(bikelane.category, 'footAndCyclewayShared_adjoiningOrIsolated')
      assert.are.equal(bikelane.surface, 'paving_stones')
      assert.are.equal(bikelane.description, 'TILDA_surface_left=asphalt')
    end)

    it('takes the worse side value on a bikelane without `surface`', function()
      local cycleways = run({
        highway = 'path', bicycle = 'designated', foot = 'designated', segregated = 'no',
        ['surface:left'] = 'asphalt', ['surface:right'] = 'sett',
      })
      local bikelane = self_row(cycleways)
      assert.are.equal(bikelane.surface, 'sett')
      assert.are.equal(bikelane.surface_source, 'tag_directional')
      assert.are.equal(bikelane.smoothness, 'bad')
      assert.are.equal(bikelane.description, 'TILDA_surface_left=asphalt')
    end)

    it('reads `surface:<side>` of the road on a bus lane', function()
      local cycleways = run({
        highway = 'secondary', surface = 'sett', ['surface:right'] = 'asphalt',
        ['cycleway:right'] = 'share_busway',
      })
      local lane
      for _, cycleway in ipairs(cycleways) do
        if cycleway._side == 'right' then lane = cycleway end
      end
      assert.are.equal(lane.category, 'sharedBusLaneBusWithBike')
      assert.are.equal(lane.surface, 'asphalt')
      assert.are.equal(lane.surface_source, 'parent_highway_tag_directional')
      assert.are.equal(lane.smoothness, 'good')
      assert.is_nil(lane.description)
    end)

    it('reads `surface:forward` of the road on a lane on the right', function()
      local cycleways = run({
        highway = 'residential', ['surface:forward'] = 'asphalt', ['surface:backward'] = 'sett',
        ['cycleway:both'] = 'lane', ['cycleway:both:lane'] = 'advisory',
      })
      local surfaces = {}
      for _, cycleway in ipairs(cycleways) do surfaces[cycleway._side] = cycleway.surface end
      assert.are.equal(surfaces.right, 'asphalt')
      assert.are.equal(surfaces.left, 'sett')
    end)

    it('puts the hints first and keeps the OSM description with `;` as it is', function()
      run({ highway = 'residential', surface = 'sett', ['surface:right'] = 'asphalt', description = 'Zufahrt; nur Anlieger' })
      assert.are.equal(rows.roads[1].tags.description,
        'TILDA_surface_right=asphalt;OSM-`description`: Zufahrt; nur Anlieger')
    end)

    it('names sides only; the side value wins over the direction value', function()
      run({ highway = 'residential', surface = 'sett', ['surface:right'] = 'asphalt', ['surface:forward'] = 'concrete', ['surface:backward'] = 'asphalt' })
      assert.are.equal(rows.roads[1].tags.description, 'TILDA_surface_right=asphalt;TILDA_surface_left=asphalt')
    end)

    it('uses the side values when `surface` is not in the allowlist', function()
      run({ highway = 'residential', surface = 'not_a_surface', ['surface:left'] = 'asphalt', ['surface:right'] = 'sett' })
      local tags = rows.roads[1].tags
      assert.are.equal(tags.surface, 'sett')
      assert.are.equal(tags.surface_source, 'tag_directional')
      assert.are.equal(tags.description, 'TILDA_surface_left=asphalt')
    end)

    it('keeps the tagged `smoothness` on a bikelane that takes the worse side value', function()
      local cycleways = run({
        highway = 'path', bicycle = 'designated', foot = 'designated', segregated = 'no',
        smoothness = 'good', ['surface:left'] = 'asphalt', ['surface:right'] = 'sett',
      })
      assert.are.equal(self_row(cycleways).smoothness, 'good')
      assert.are.equal(rows.roadsPathClasses[1].tags.smoothness, 'good')
    end)

    it('adds no hint when the values match `surface`', function()
      run({ highway = 'residential', surface = 'asphalt', ['surface:forward'] = 'asphalt' })
      assert.is_nil(rows.roads[1].tags.description)
    end)

    it('ignores values outside the allowlist', function()
      run({ highway = 'residential', surface = 'asphalt', ['surface:bicycle'] = '<script>' })
      assert.is_nil(rows.roads[1].tags.description)
    end)
  end)

  it('publishes no internal todo state', function()
    run({ highway = 'cycleway', width = '0', bicycle = 'designated' })
    run({ highway = 'residential', width = '0' })
    for _, name in ipairs({ 'roads', 'roadsPathClasses', 'bikeSuitability' }) do
      for _, row in ipairs(rows[name]) do
        assert.is_nil(row.tags._self_bikelane_has_unusual_width, name)
        assert.is_nil(row.tags._todo_list, name)
      end
    end
  end)
end)
