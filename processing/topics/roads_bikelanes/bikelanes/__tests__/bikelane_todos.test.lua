describe('bikelane_todos', function()
  local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
  local inspect = require('inspect')
  local osm2pgsql = require('topics.helper.osm2pgsql')
  local table_size = require('topics.helper.table_size')
  local table_includes = require('topics.helper.table_includes')

  ---@param input_object { tags: table, id: number|string, type: string }
  ---@return table
  local function run_bikelanes(input_object)
    input_object.tags._id = input_object.id
    input_object.tags._type = input_object.type
    return bikelanes(input_object.tags, input_object)
  end

  describe('`missing_access_tag_240`:', function()
    it('`cycleway=track` does not show up in category', function()
      local input_object = {
        tags = {
          ['highway'] = 'tertiary',
          ['cycleway:left'] = 'track',
          ['cycleway:left:traffic_sign'] = 'DE:240',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'missing_access_tag_240'), false)
    end)

    it('creates todo for traffic_sign=DE:240 with bicycle=designated and no foot', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['bicycle'] = 'designated',
          ['traffic_sign'] = 'DE:240',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'missing_access_tag_240'), true)
    end)

    it('creates todo for traffic_sign=DE:240 with foot=designated and no bicycle', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['foot'] = 'designated',
          ['traffic_sign'] = 'DE:240',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'missing_access_tag_240'), true)
    end)

    it('does not create todo for traffic_sign=DE:240 with bicycle=designated and foot=designated', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['bicycle'] = 'designated',
          ['foot'] = 'designated',
          ['traffic_sign'] = 'DE:240',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'missing_access_tag_240'), false)
    end)

    it('creates todo for traffic_sign=DE:241 with neither bicycle=designated nor foot=designated', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['traffic_sign'] = 'DE:241',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'missing_access_tag_240'), true)
    end)
  end)

  describe('`malformed_traffic_sign`:', function()
    it('happy path', function()
      local input_object = {
        tags = {
          ['highway'] = 'residential',
          ['bicycle_road'] = 'yes',
          ['traffic_sign'] = 'DE:244.1,1020-30,1026-36',
          ['traffic_sign:forward'] = 'DE:244.1,1020-30,1026-36',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'malformed_traffic_sign'), false)
    end)
    it('create todo', function()
      local input_object = {
        tags = {
          ['highway'] = 'residential',
          ['bicycle_road'] = 'yes',
          ['traffic_sign'] = 'DE:244.1,1020-30, 1026-36',
          ['traffic_sign:right'] = 'D:244.1,1020-30,1026-36',
        },
        id = 1,
        type = 'way'
      }
      local result = run_bikelanes(input_object)
      assert.are.equal(table_includes(result[1]._todo_list, 'malformed_traffic_sign'), true)
    end)
  end)

  describe('`currentness_too_old`:', function()
    -- We cannot test the age part well because I don't know how to stub object.timestamp.
    -- This test is a false positive because it always returns true
    --
    -- it('15 year old way shows up in category', function()
    --   local input_object = {
    --     tags = {
    --       ['highway'] = 'cycleway',
    --     },
    --     meta = {
    --       -- We removed this way to store the age. But it was never why this test was green…
    --       ['updated_age'] = 5475,
    --     },
    --     id = 1,
    --     type = 'way'
    --   }
    --   local result = bikelanes(input_object.tags, input_object)
    --   assert.are.equal(table_includes(result[1]._todo_list, 'currentness_too_old'), false)
    -- end)
  end)

  describe('`advisory_or_exclusive`:', function()
    it('creates tasks for cycleway:both', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:both'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)

      local right = cycleways[2]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'advisory_or_exclusive'), true)
    end)

    it('creates tasks for cycleway', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)

      local right = cycleways[2]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'advisory_or_exclusive'), true)
    end)

    it('creates tasks for cycleway:left + cycleway:right', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:left'] = 'lane',
          ['cycleway:right'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)

      local right = cycleways[2]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'advisory_or_exclusive'), true)
    end)

    it('creates one task for cycleway:left', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:left'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)
    end)

    it('creates one task for cycleway:left + track', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:left'] = 'lane',
          ['cycleway:right'] = 'track',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)
    end)

    it('creates one task for cycleway:right', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:right'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)
    end)

    it('creates one task for cycleway:right + track', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:left'] = 'track',
          ['cycleway:right'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[2]
      assert.are.equal(left._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(left._todo_list, 'advisory_or_exclusive'), true)
    end)
  end)

  describe('`needs_clarification_track`:', function()
    it('creates tasks for cycleway:both', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:both'] = 'track',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'needs_clarification_track'), true)

      local right = cycleways[2]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'needs_clarification_track'), true)
    end)

    it('skip only on the side with sufficient tagging', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:both'] = 'track',
          ['cycleway:left:traffic_sign'] = 'DE:241-30',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'needs_clarification_track'), false)

      local right = cycleways[2]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'needs_clarification_track'), true)
    end)

    it('skip on both sides with cycleway:both:segregated', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:both'] = 'track',
          ['cycleway:both:segregated'] = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_includes(cycleways[1]._todo_list, 'needs_clarification_track'), false)
      assert.are.equal(table_includes(cycleways[2]._todo_list, 'needs_clarification_track'), false)
    end)

    it('skip when the track has traffic_sign DE:237', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:right'] = 'track',
          ['cycleway:right:traffic_sign'] = 'DE:237',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      local right = cycleways[1]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'needs_clarification_track'), false)
    end)
  end)

  describe('`mixed_cycleway_both`:', function()
    it('creates tasks for cycleway', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway'] = 'track',
          ['cycleway:left'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'mixed_cycleway_both'), true)

      local right = cycleways[2]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(table_includes(right._todo_list, 'mixed_cycleway_both'), true)
    end)
  end)

  describe('`missing_oneway`:', function()
    it('creates tasks for oneway', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['is_sidepath'] = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      -- print('xxxdata'..inspect(data))
      assert.are.equal(data._id, 'way/1')
      assert.are.equal(table_includes(data._todo_list, 'missing_oneway'), true)
    end)

    it('skips lanes and tracks tagged on the road (one-way per side by default)', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['sidewalk:right'] = 'yes',
          ['sidewalk:right:bicycle'] = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local right = nil
      for _, cycleway in ipairs(run_bikelanes(input_object)) do
        if cycleway._side == 'right' then right = cycleway end
      end
      assert.are.equal(right.category, 'footwayBicycleYes_adjoining')
      assert.are.equal(right.oneway, 'implicit_yes')
      assert.are.equal(table_includes(right._todo_list, 'missing_oneway'), false)
    end)

    it('skips own geometries with oneway=-1', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['is_sidepath'] = 'yes',
          ['oneway'] = '-1',
        },
        id = 1,
        type = 'way'
      }
      local data = run_bikelanes(input_object)[1]
      assert.are.equal(data.oneway, 'yes')
      assert.are.equal(table_includes(data._todo_list, 'missing_oneway'), false)
    end)

    it('skips specific category cyclewayLink', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['cycleway'] = 'link',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      -- print('xxxdata'..inspect(data))
      assert.are.equal(data._id, 'way/1')
      assert.are.equal(table_includes(data._todo_list, 'missing_oneway'), false)
    end)

    it('skips implicitOneWayConfidence=high', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['cycleway'] = 'share_busway',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      -- print('xxxdata'..inspect(data))
      assert.are.equal(data._id, 'way/1')
      assert.are.equal(table_includes(data._todo_list, 'missing_oneway'), false)
    end)

    it('skips cycleway=track', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:left'] = 'track',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local left = cycleways[1]
      -- print('xxxleft'..inspect(left))
      assert.are.equal(left._id, 'way/1/cycleway/left')
      assert.are.equal(table_includes(left._todo_list, 'missing_oneway'), false)
    end)

    it('skips advisory lane with implicit_yes oneway', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'advisory',
        },
        id = 1,
        type = 'way',
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local right = cycleways[1]
      assert.are.equal(right._id, 'way/1/cycleway/right')
      assert.are.equal(right.category, 'cyclewayOnHighway_advisory')
      assert.are.equal(right.oneway, 'implicit_yes')
      assert.are.equal(table_includes(right._todo_list, 'missing_oneway'), false)
    end)
  end)

  describe('`missing_width`:', function()
    it('skips specific category cyclewayLink', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['cycleway'] = 'link',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(data._id, 'way/1')
      assert.are.equal(table_includes(data._todo_list, 'missing_width'), false)
    end)
  end)

  describe('`missing_segregated`:', function()
    it('creates missing_segregated but not needs_clarification for path with designated bicycle and foot', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['bicycle'] = 'designated',
          ['foot'] = 'designated',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(data.category, 'needsClarification')
      assert.are.equal(table_includes(data._todo_list, 'missing_segregated'), true)
      assert.are.equal(table_includes(data._todo_list, 'needs_clarification'), false)
    end)

    it('creates missing_segregated but not needs_clarification for cycleway with designated bicycle and foot', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['bicycle'] = 'designated',
          ['foot'] = 'designated',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(data.category, 'needsClarification')
      assert.are.equal(table_includes(data._todo_list, 'missing_segregated'), true)
      assert.are.equal(table_includes(data._todo_list, 'needs_clarification'), false)
    end)

    it('creates missing_segregated for path with designated bicycle and foot and no segregated tag', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['bicycle'] = 'designated',
          ['foot'] = 'designated',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(data.category, 'needsClarification')
      assert.are.equal(table_includes(data._todo_list, 'missing_segregated'), true)
    end)

    it('does not create missing_segregated for path with designated bicycle and foot and segregated=yes', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['bicycle'] = 'designated',
          ['foot'] = 'designated',
          ['segregated'] = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(table_includes(data._todo_list, 'missing_segregated'), false)
    end)

    it('does not create missing_segregated for path with designated bicycle and foot and segregated=no', function()
      local input_object = {
        tags = {
          ['highway'] = 'path',
          ['bicycle'] = 'designated',
          ['foot'] = 'designated',
          ['segregated'] = 'no',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(table_includes(data._todo_list, 'missing_segregated'), false)
    end)
  end)

  describe('`crossing_too_long`:', function()
    it('creates todo for long crossing (> 100m) with cycleway=crossing', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['cycleway'] = 'crossing',
          ['_length'] = 150,
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(data.category, 'needsClarification')
      assert.are.equal(table_includes(data._todo_list, 'crossing_too_long'), true)
    end)

    it('does not create todo for short crossing (< 100m)', function()
      local input_object = {
        tags = {
          ['highway'] = 'cycleway',
          ['cycleway'] = 'crossing',
          ['_length'] = 50,
        },
        id = 1,
        type = 'way'
      }
      local cycleways = run_bikelanes(input_object)
      assert.are.equal(table_size(cycleways), 1)

      local data = cycleways[1]
      assert.are.equal(data.category, 'crossing')
      assert.are.equal(table_includes(data._todo_list, 'crossing_too_long'), false)
    end)
  end)
  describe('`__mapillary` todos on lanes tagged on the road:', function()
    ---@param mapillary_coverage string|nil
    local function run_advisory_lanes(mapillary_coverage)
      return run_bikelanes({
        tags = {
          ['highway'] = 'tertiary',
          ['cycleway:both'] = 'lane',
          ['mapillary_coverage'] = mapillary_coverage,
        },
        id = 1,
        type = 'way'
      })
    end

    it('lanes get the campaign and priority 1 when the road has Mapillary coverage', function()
      local lanes = run_advisory_lanes('regular')
      assert.are.equal(table_size(lanes), 2)
      for _, lane in ipairs(lanes) do
        assert.are.equal(lane._todo_list['advisory_or_exclusive'], 'prio1')
        assert.are.equal(lane._todo_list['advisory_or_exclusive__mapillary'], 'prio1')
      end
    end)

    it('lanes get no campaign when the road has no Mapillary coverage', function()
      local lanes = run_advisory_lanes(nil)
      assert.are.equal(table_size(lanes), 2)
      for _, lane in ipairs(lanes) do
        assert.are.equal(lane._todo_list['advisory_or_exclusive'], 'prio2')
        assert.are.equal(table_includes(lane._todo_list, 'advisory_or_exclusive__mapillary'), false)
      end
    end)
  end)
end)
