local build_segments = require('topics.roads_bikelanes.routing_infra.build_segments')

describe('build_segments carriageway edges', function()
  require('topics.helper.osm2pgsql')

  local line_geom = {
  }
  function line_geom:reverse()
    return self
  end

  ---@param object_tags table
  ---@param cycleways table[]|nil
  ---@return table[]
  local function carriageway_segments(object_tags, cycleways)
    return build_segments({
      object_tags = object_tags,
      object_geom = line_geom,
      cycleways = cycleways or {},
      shared_result_tags = { road = 'residential' },
    })
  end

  it('two-way road is one edge with oneway=no', function()
    local segments = carriageway_segments({ highway = 'residential', _id = 42, _type = 'way' })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'roads')
    assert.are.equal(segments[1].side, 'self')
    assert.are.equal(segments[1].category, 'mixedTrafficMotor')
    assert.are.equal(segments[1].edge_oneway, 'no')
    assert.is_nil(segments[1].oneway_motor)
  end)

  it('all-modes oneway is one edge with oneway=yes', function()
    local segments = carriageway_segments({ highway = 'residential', oneway = 'yes', _id = 9, _type = 'way' })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].edge_oneway, 'yes')
    assert.is_nil(segments[1].oneway_motor)
  end)

  it('contraflow road is one edge along the car direction with oneway_motor=yes', function()
    local reversed_geom = {}
    local way_geom = {}
    function way_geom:reverse()
      return reversed_geom
    end

    local segments = build_segments({
      object_tags = { highway = 'residential', oneway = '-1', ['oneway:bicycle'] = 'no', _id = 7, _type = 'way' },
      object_geom = way_geom,
      cycleways = {},
      shared_result_tags = { road = 'residential' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].category, 'mixedTrafficMotor')
    assert.are.equal(segments[1].edge_oneway, 'no')
    assert.are.equal(segments[1].oneway_motor, 'yes')
    assert.are.equal(segments[1].geom, reversed_geom)
  end)

  it('carriageway id is the roads id', function()
    local segments = carriageway_segments({ highway = 'residential', _id = 42, _type = 'way' })

    assert.are.equal(segments[1].segment_id, 'way/42')
    assert.are.equal(segments[1].parent_id, 'way/42')
    assert.are.equal(segments[1].source_id, 'way/42')
  end)

  it('keeps carriageway edges next to a Mittellage bike lane on the centerline', function()
    local segments = carriageway_segments({
      highway = 'primary',
      _id = 12,
      _type = 'way',
    }, {
      {
        _id = 'way/12',
        _side = 'self',
        _infrastructureExists = true,
        category = 'cyclewayOnHighwayBetweenLanes',
      },
    })

    local by_table = {}
    for _, segment in ipairs(segments) do
      by_table[segment.source_table] = by_table[segment.source_table] or {}
      table.insert(by_table[segment.source_table], segment)
    end
    assert.are.equal(#by_table.bikelanes, 1)
    assert.are.equal(by_table.bikelanes[1].category, 'cyclewayOnHighwayBetweenLanes')
    -- Unique row id next to the carriageway `way/12`; still joins bikelanes `way/12`.
    assert.are.equal(by_table.bikelanes[1].segment_id, 'way/12/cycleway/self')
    assert.are.equal(by_table.bikelanes[1].source_id, 'way/12')
    assert.are.equal(#by_table.roads, 1)
    assert.are.equal(by_table.roads[1].segment_id, 'way/12')
    assert.are.equal(by_table.roads[1].category, 'mixedTrafficMotor')
  end)

  it('Fahrradstraße on the centerline replaces the carriageway edges', function()
    local segments = carriageway_segments({
      highway = 'residential',
      bicycle_road = 'yes',
      _id = 13,
      _type = 'way',
    }, {
      {
        _id = 'way/13',
        _side = 'self',
        _infrastructureExists = true,
        category = 'bicycleRoad',
      },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'bikelanes')
    assert.are.equal(segments[1].category, 'bicycleRoad')
  end)
end)

describe('build_segments join keys', function()
  require('topics.helper.osm2pgsql')

  local line_geom = {}
  function line_geom:reverse()
    return self
  end

  it('bikelanes join keys match bikelanes.id', function()
    local segments = build_segments({
      object_tags = { highway = 'residential', _id = 8, _type = 'way' },
      object_geom = line_geom,
      cycleways = {
        {
          _id = 'way/8/cycleway/right',
          _side = 'right',
          _infrastructureExists = true,
          category = 'cyclewayOnHighwayExclusive',
          prefix = 'cycleway',
        },
      },
      shared_result_tags = { road = 'residential' },
    })

    local virtual = nil
    for _, segment in ipairs(segments) do
      if segment.source_table == 'bikelanes' then
        virtual = segment
      end
    end
    assert.is_truthy(virtual)
    assert.are.equal(virtual.segment_id, 'way/8/cycleway/right')
    assert.are.equal(virtual.parent_id, 'way/8')
    assert.are.equal(virtual.source_table, 'bikelanes')
    assert.are.equal(virtual.source_id, 'way/8/cycleway/right')
  end)

  it('path edges always join roadsPathClasses', function()
    local segments = build_segments({
      object_tags = { highway = 'cycleway', bicycle = 'designated', _id = 3, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'cycleway' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
    assert.are.equal(segments[1].source_id, 'way/3')
    assert.are.equal(segments[1].parent_id, 'way/3')
    assert.are.equal(segments[1].category, 'mixedTrafficFoot')
  end)

  it('path edges without a bikelane category joins roadsPathClasses as mixedTrafficFoot', function()
    local segments = build_segments({
      object_tags = { highway = 'steps', _id = 11, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = nil },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].category, 'mixedTrafficFoot')
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
    assert.are.equal(segments[1].source_id, 'way/11')
    assert.are.equal(segments[1].parent_id, 'way/11')
  end)

  it('drops uncategorized OSM sidewalks', function()
    local segments = build_segments({
      object_tags = { highway = 'footway', footway = 'sidewalk', _id = 5, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'footway_sidewalk' },
    })
    assert.are.equal(#segments, 0)
  end)

  it('keeps sidewalks that are bike-permitted as bikelanes edges', function()
    local segments = build_segments({
      object_tags = {
        highway = 'footway',
        footway = 'sidewalk',
        bicycle = 'yes',
        _id = 6,
        _type = 'way',
      },
      object_geom = line_geom,
      cycleways = {
        {
          _id = 'way/6',
          _side = 'self',
          _infrastructureExists = true,
          category = 'footwayBicycleYes_adjoiningOrIsolated',
        },
      },
      shared_result_tags = { road = 'footway_sidewalk' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'bikelanes')
    assert.are.not_equal(segments[1].category, 'mixedTrafficFoot')
    assert.is_truthy(segments[1].category)
  end)

  it('keeps implicit bicycle paths as mixedTrafficFoot', function()
    local segments = build_segments({
      object_tags = { highway = 'path', _id = 9, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'path' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].category, 'mixedTrafficFoot')
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
  end)

  it('drops uncategorized indoor footways and steps that roadsPathClasses omits', function()
    local indoor_footway = build_segments({
      object_tags = { highway = 'footway', indoor = 'yes', _id = 12, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'footway' },
    })
    local indoor_steps = build_segments({
      object_tags = { highway = 'steps', indoor = 'yes', _id = 13, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'footway_steps' },
    })
    assert.are.equal(#indoor_footway, 0)
    assert.are.equal(#indoor_steps, 0)
  end)

  it('drops uncategorized destination footways that roadsPathClasses omits', function()
    local segments = build_segments({
      object_tags = { highway = 'footway', access = 'destination', _id = 14, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'footway' },
    })
    assert.are.equal(#segments, 0)
  end)

  it('keeps outdoor uncategorized footways as mixedTrafficFoot', function()
    local segments = build_segments({
      object_tags = { highway = 'footway', _id = 15, _type = 'way' },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'footway' },
    })
    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].category, 'mixedTrafficFoot')
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
  end)

  it('path edge oneway=yes with oneway:bicycle=no is no', function()
    local segments = build_segments({
      object_tags = {
        highway = 'path',
        oneway = 'yes',
        ['oneway:bicycle'] = 'no',
        _id = 21,
        _type = 'way',
      },
      object_geom = line_geom,
      cycleways = {},
      shared_result_tags = { road = 'path' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
    assert.are.equal(segments[1].tags.oneway, 'no')
    assert.are.equal(segments[1].edge_oneway, 'no')
  end)

  it('bikelane edges publish oneway as plain yes/no', function()
    local segments = build_segments({
      object_tags = { highway = 'residential', _id = 25, _type = 'way' },
      object_geom = line_geom,
      cycleways = {
        { _id = 'way/25/cycleway/left', _side = 'left', _infrastructureExists = true, category = 'cyclewayOnHighway_advisory', oneway = 'implicit_yes' },
        { _id = 'way/25/cycleway/right', _side = 'right', _infrastructureExists = true, category = 'cycleway_adjoining', oneway = 'assumed_no' },
      },
      shared_result_tags = { road = 'residential' },
    })
    local fahrradstrasse = build_segments({
      object_tags = { highway = 'residential', bicycle_road = 'yes', oneway = 'yes', ['oneway:bicycle'] = 'no', _id = 26, _type = 'way' },
      object_geom = line_geom,
      cycleways = {
        { _id = 'way/26', _side = 'self', _infrastructureExists = true, category = 'bicycleRoad', oneway = 'car_not_bike' },
      },
      shared_result_tags = { road = 'bicycle_road' },
    })

    local oneway_by_id = {}
    for _, segment in ipairs(segments) do
      oneway_by_id[segment.segment_id] = segment.edge_oneway
    end
    assert.are.equal(oneway_by_id['way/25/cycleway/left'], 'yes')
    assert.are.equal(oneway_by_id['way/25/cycleway/right'], 'no')
    assert.are.equal(#fahrradstrasse, 1)
    assert.are.equal(fahrradstrasse[1].edge_oneway, 'no')
    assert.are.equal(fahrradstrasse[1].oneway_motor, 'yes')
  end)

  it('self bikelane oneway=-1 is yes with reversed geometry', function()
    local reversed_geom = {}
    local way_geom = {}
    function way_geom:reverse()
      return reversed_geom
    end

    local segments = build_segments({
      object_tags = { highway = 'cycleway', oneway = '-1', _id = 24, _type = 'way' },
      object_geom = way_geom,
      cycleways = {
        { _id = 'way/24', _side = 'self', _infrastructureExists = true, category = 'cycleway_isolated', oneway = 'assumed_no' },
      },
      shared_result_tags = { road = 'cycleway' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'bikelanes')
    assert.are.equal(segments[1].edge_oneway, 'yes')
    assert.are.equal(segments[1].geom, reversed_geom)
  end)

  it('path edge oneway=-1 is yes with reversed geometry', function()
    local reversed_geom = {}
    local path_geom = {}
    function path_geom:reverse()
      return reversed_geom
    end

    local segments = build_segments({
      object_tags = { highway = 'path', oneway = '-1', _id = 22, _type = 'way' },
      object_geom = path_geom,
      cycleways = {},
      shared_result_tags = { road = 'path' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].tags.oneway, 'yes')
    assert.are.equal(segments[1].edge_oneway, 'yes')
    assert.are.equal(segments[1].geom, reversed_geom)
  end)

  it('path edge keeps a non-infra self category and joins roadsPathClasses', function()
    local segments = build_segments({
      object_tags = { highway = 'path', _id = 23, _type = 'way' },
      object_geom = line_geom,
      cycleways = {
        {
          _side = 'self',
          _infrastructureExists = false,
          category = 'needsClarification',
        },
      },
      shared_result_tags = { road = 'path' },
    })

    assert.are.equal(#segments, 1)
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
    assert.are.equal(segments[1].category, 'needsClarification')
    assert.are.equal(segments[1].source_table, 'roadsPathClasses')
    assert.are.equal(segments[1].source_id, 'way/23')
  end)
end)
