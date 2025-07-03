describe("Bikelanes", function()
  require('init')
  require("osm2pgsql")
  require("Bikelanes")

  describe('Handle `width`:', function()
    it('handels width on centerline', function()
      local input_object = {
        tags = {
          highway = 'residential',
          width = '5 m',
          bicycle_road = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "bicycleRoad")
      assert.are.equal(result[1].width, 5)
    end)

    it('handels explicit width on transformed objects', function()
      local input_object = {
        tags = {
          highway = 'residential',
          width = '10 m',
          ['cycleway:left'] = 'track',
          ['cycleway:left:width'] = '5 m',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "cycleway_adjoining")
      assert.are.equal(result[1].width, 5)
    end)

    it('handels nested width on paths', function()
      local input_object = {
        tags = {
          highway = 'path',
          bicycle = 'designated',
          foot = 'designated',
          segregated = "yes",
          is_sidepath = "yes",
          ['cycleway:width'] = '5 m',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "footAndCyclewaySegregated_adjoining")
      assert.are.equal(result[1].width, 5)
    end)
  end)

  describe('Handle footAndCyclewaySegregated with traffic_mode', function()
    it('simple footAndCyclewaySegregated', function()
      local input_object = {
        tags = {
          highway = 'path',
          bicycle = 'designated',
          foot = 'designated',
          segregated = 'yes',
          is_sidepath = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "footAndCyclewaySegregated_adjoining")
    end)

    it('separate cycle and foot geometry with traffic_mode', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          ["traffic_mode:right"] = 'foot',
          is_sidepath = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "footAndCyclewaySegregated_adjoining")
    end)

    it('separate cycle and foot geometry with traffic_mode and separation=no', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          ["traffic_mode:right"] = 'foot',
          ["separation:right"] = 'no',
          is_sidepath = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "footAndCyclewaySegregated_adjoining")
    end)

    it('separate cycle and foot geometry with traffic_mode and separation=something', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          ["traffic_mode:right"] = 'foot',
          ["separation:right"] = 'something',
          is_sidepath = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      assert.are.equal(result[1].category, "cycleway_adjoining")
    end)
  end)

  describe("explicit category tests", function()

    it('Categories for "Angstweiche" and "Schutzstreifen" using cycleway:lanes', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'exclusive',
          ['cycleway:lanes'] = 'no|no|no|lane|no|lane',
          ['cycleway:right:traffic_sign'] = 'DE:237'
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        if v._side == 'self' then
          assert.are.equal(v.category, "cyclewayOnHighwayBetweenLanes")
        end
        if v._side == 'right' and v.prefix == 'cycleway' then
          assert.are.equal(v.category, "cyclewayOnHighway_exclusive")
        end
      end
    end)

    it('Categories for "Angstweiche" and "Schutzstreifen" using bicycle:lanes', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'exclusive',
          ['bicycle:lanes'] = 'no|no|no|designated|no|designated',
          ['cycleway:right:traffic_sign'] = 'DE:237'
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        if v._side == 'self' then
          assert.are.equal(v.category, "cyclewayOnHighwayBetweenLanes")
        end
        if v._side == 'right' and v.prefix == 'cycleway' then
          assert.are.equal(v.category, "cyclewayOnHighway_exclusive")
        end
      end
    end)

    it('Categories for "Angstweiche" (only) using cycleway:lanes', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right'] = 'lane',
          ['cycleway:lanes'] = 'no|no|no|lane|no',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        if v._side == 'self' then
          assert.are.equal(v.category, "cyclewayOnHighwayBetweenLanes")
        end
        if v._side == 'right' and v.prefix == 'cycleway' then
          assert.are.equal(v.category, "cyclewayOnHighway_exclusive")
        end
      end
    end)

    it('Categories for "Angstweiche" (only) using bicycle:lanes', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right'] = 'lane',
          ['bicycle:lanes'] = 'no|no|no|designated|no',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        if v._side == 'self' then
          assert.are.equal(v.category, "cyclewayOnHighwayBetweenLanes")
        end
        if v._side == 'right' and v.prefix == 'cycleway' then
          assert.are.equal(v.category, "cyclewayOnHighway_exclusive")
        end
      end
    end)

    it('Categories for protected bikelanes', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right:separation:left'] = 'line',
          ['cycleway:left:separation:left'] = 'vertical_panel',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        if v._side == 'right' and v.prefix == 'cycleway' then
          assert.are.equal("needsClarification", v.category)
        end
        if v._side == 'left' and v.prefix == 'cycleway' then
          assert.are.equal("cyclewayOnHighwayProtected", v.category)
        end
      end
    end)

    it('Categories for protected bikelanes (traffic_mode:right=motor_vehicle)', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right:separation:left'] = 'line',
          ['cycleway:left:separation:left'] = 'vertical_panel',
          ['cycleway:left:traffic_mode:right'] = 'motor_vehicle'
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        if v._side == 'right' and v.prefix == 'cycleway' then
          -- Any `cycleway:(nil|both|right)` creates a transformed geometry for `right` which will fall back to `needsClarification` if no other tags are given
          assert.are.equal("needsClarification", v.category)
        end
        if v._side == 'left' and v.prefix == 'cycleway' then
          assert.are.equal("needsClarification", v.category)
        end
      end
    end)

    it('Categories for protected bikelanes (only left)', function()
      local input_object = {
        highway = 'primary',
        tags = {
          ['cycleway:left'] = 'lane',
          ['cycleway:left:bicyle'] = 'yes',
          ['cycleway:left:separation:left'] = 'yes'
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object)
      for _, v in pairs(result) do
        assert.are.equal('left', v._side) -- no 'right' side
        if v._side == 'left' and v.prefix == 'cycleway' then
          assert.are.equal('cyclewayOnHighway_advisoryOrExclusive', v.category)
        end
      end
    end)
  end)
end)
