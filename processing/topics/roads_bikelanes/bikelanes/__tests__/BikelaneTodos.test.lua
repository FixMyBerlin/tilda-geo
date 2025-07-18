require('init')
require("osm2pgsql")
require("TableSize")
require("TableIncludes")
require("Bikelanes")
local inspect = require('inspect')

describe("BikelaneTodos", function()
  describe('`missing_access_tag_240`:', function()
    it('`cycleway=track` does not show up in category', function()
      local input_object = {
        tags = {
          ["highway"] = 'tertiary',
          ["cycleway:left"] = 'track',
          ["cycleway:left:traffic_sign"] = 'DE:240',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(TableIncludes(result[1]._todo_list, "missing_access_tag_240"), false)
    end)
  end)

  describe('`malformed_traffic_sign`:', function()
    it('happy path', function()
      local input_object = {
        tags = {
          ["highway"] = 'residential',
          ["bicycle_road"] = 'yes',
          ["traffic_sign"] = 'DE:244.1,1020-30,1026-36',
          ["traffic_sign:forward"] = 'DE:244.1,1020-30,1026-36',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(TableIncludes(result[1]._todo_list, "malformed_traffic_sign"), false)
    end)
    it('create todo', function()
      local input_object = {
        tags = {
          ["highway"] = 'residential',
          ["bicycle_road"] = 'yes',
          ["traffic_sign"] = 'DE:244.1,1020-30, 1026-36',
          ["traffic_sign:right"] = 'D:244.1,1020-30,1026-36',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(TableIncludes(result[1]._todo_list, "malformed_traffic_sign"), true)
    end)
  end)

  describe('`currentness_too_old`:', function()
    -- We cannot test the age part well because I don't know how to stub object.timestamp.
    -- This test is a false positive because it always returns true
    --
    -- it('15 year old way shows up in category', function()
    --   local input_object = {
    --     tags = {
    --       ["highway"] = 'cycleway',
    --     },
    --     meta = {
    --       -- We removed this way to store the age. But it was never why this test was green…
    --       ["updated_age"] = 5475,
    --     },
    --     id = 1,
    --     type = 'way'
    --   }
    --   local result = Bikelanes(input_object)
    --   assert.are.equal(TableIncludes(result[1]._todo_list, "currentness_too_old"), false)
    -- end)
  end)

  describe('`advisory_or_exclusive`:', function()
    it('creates tasks for cycleway:both', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:both"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)

      local right = cycleways[2]
      assert.are.equal(right._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(right._todo_list, "advisory_or_exclusive"), true)
    end)

    it('creates tasks for cycleway', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)

      local right = cycleways[2]
      assert.are.equal(right._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(right._todo_list, "advisory_or_exclusive"), true)
    end)

    it('creates tasks for cycleway:left + cycleway:right', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:left"] = 'lane',
          ["cycleway:right"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)

      local right = cycleways[2]
      assert.are.equal(right._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(right._todo_list, "advisory_or_exclusive"), true)
    end)

    it('creates one task for cycleway:left', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:left"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 1)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)
    end)

    it('creates one task for cycleway:left + track', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:left"] = 'lane',
          ["cycleway:right"] = 'track',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)
    end)

    it('creates one task for cycleway:right', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:right"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 1)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)
    end)

    it('creates one task for cycleway:right + track', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:left"] = 'track',
          ["cycleway:right"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[2]
      assert.are.equal(left._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(left._todo_list, "advisory_or_exclusive"), true)
    end)
  end)

  describe('`needs_clarification_track`:', function()
    it('creates tasks for cycleway:both', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:both"] = 'track',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "needs_clarification_track"), true)

      local right = cycleways[2]
      assert.are.equal(right._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(right._todo_list, "needs_clarification_track"), true)
    end)

    it('skip when sufficient tagging is present', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:both"] = 'track',
          ["cycleway:left:traffic_sign"] = 'DE:241-30',
          -- ["cycleway:left:segregated"] = 'yes', -- works as well
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "needs_clarification_track"), false)

      local right = cycleways[2]
      assert.are.equal(right._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(right._todo_list, "needs_clarification_track"), false)
    end)
  end)

  describe('`mixed_cycleway_both`:', function()
    it('creates tasks for cycleway', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway"] = 'track',
          ["cycleway:left"] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 2)

      local left = cycleways[1]
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "mixed_cycleway_both"), true)

      local right = cycleways[2]
      assert.are.equal(right._id, "way/1/cycleway/right")
      assert.are.equal(TableIncludes(right._todo_list, "mixed_cycleway_both"), true)
    end)
  end)

  describe('`missing_oneway`:', function()
    it('creates tasks for oneway', function()
      local input_object = {
        tags = {
          ["highway"] = 'cycleway',
          ["is_sidepath"] = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 1)

      local data = cycleways[1]
      -- print('xxxdata'..inspect(data))
      assert.are.equal(data._id, "way/1")
      assert.are.equal(TableIncludes(data._todo_list, "missing_oneway"), true)
    end)

    it('skips specific category "cyclewayLink"', function()
      local input_object = {
        tags = {
          ["highway"] = 'cycleway',
          ["cycleway"] = 'link',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 1)

      local data = cycleways[1]
      -- print('xxxdata'..inspect(data))
      assert.are.equal(data._id, "way/1")
      assert.are.equal(TableIncludes(data._todo_list, "missing_oneway"), false)
    end)

    it('skips implicitOneWayConfidence="high"', function()
      local input_object = {
        tags = {
          ["highway"] = 'cycleway',
          ["cycleway"] = 'share_busway',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 1)

      local data = cycleways[1]
      -- print('xxxdata'..inspect(data))
      assert.are.equal(data._id, "way/1")
      assert.are.equal(TableIncludes(data._todo_list, "missing_oneway"), false)
    end)

    it('skips cycleway="track"', function()
      local input_object = {
        tags = {
          ["highway"] = 'secondary',
          ["cycleway:left"] = 'track',
        },
        id = 1,
        type = 'way'
      }
      local cycleways = Bikelanes(input_object)
      assert.are.equal(TableSize(cycleways), 1)

      local left = cycleways[1]
      -- print('xxxleft'..inspect(left))
      assert.are.equal(left._id, "way/1/cycleway/left")
      assert.are.equal(TableIncludes(left._todo_list, "missing_oneway"), false)
    end)
  end)
end)
