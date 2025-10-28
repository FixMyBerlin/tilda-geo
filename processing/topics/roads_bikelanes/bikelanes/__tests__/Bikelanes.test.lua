describe("Bikelanes", function()
  require('init')
  require("osm2pgsql")
  require("Bikelanes")
  local extractCategoriesBySide = require('extractCategoriesBySide')

  describe('Handle `traffic_sign`:', function()
    it('processes descriptive German traffic signs', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          bicycle_road = 'yes',
          traffic_sign = 'Rad/Fuß: Fußgänger haben Vorrang.',
        },
        id = 1,
        type = 'way',
      }
      local result = Bikelanes(input_object.tags, input_object)

      assert.are.equal(result[1].category, "bicycleRoad")
      assert.are.equal(result[1].traffic_sign, "Rad/Fuß: Fußgänger haben Vorrang.")
    end)
  end)

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
      local result = Bikelanes(input_object.tags, input_object)
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
      local result = Bikelanes(input_object.tags, input_object)
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
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal(result[1].category, "footAndCyclewaySegregated_adjoining")
      assert.are.equal(result[1].width, 5)
    end)
  end)

  describe('Handle `mapillary*` cases', function()
    it('simple mapillary', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          bicycle_road = 'yes',
          mapillary = 'm123',
          ['mapillary:forward'] = 'mf123',
          ['mapillary:backward'] = 'mb123',
          ['source:traffic_sign:forward:mapillary'] = 'stmf123',
          ['source:traffic_sign:backward:mapillary'] = 'stmf123',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal('bicycleRoad', result[1].category)
      assert.are.equal('m123', result[1].mapillary)
      assert.are.equal('mf123', result[1]['mapillary_forward'])
      assert.are.equal('mb123', result[1]['mapillary_backward'])
      assert.are.equal('stmf123', result[1]['mapillary_traffic_sign'])
    end)

    it('left right mapillary', function()
      local input_object = {
        tags = {
          highway = 'primary',
          mapillary = 'm123',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'advisory',
          ['cycleway:right:mapillary'] = 'crm345',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)

      assert.are.equal("cyclewayOnHighway_advisory", result[1].category)
      assert.are.equal('crm345;m123', result[1].mapillary)
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
      local result = Bikelanes(input_object.tags, input_object)
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
      local result = Bikelanes(input_object.tags, input_object)
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
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal(result[1].category, "footAndCyclewaySegregated_adjoining")
    end)

    it('separate cycle and foot geometry with traffic_mode and separation=yes', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          ["traffic_mode:right"] = 'foot',
          ["separation:right"] = 'yes', -- not nil, not 'no'
          is_sidepath = 'yes',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal(result[1].category, "cycleway_adjoining")
    end)
  end)

  describe('explicit category tests', function()
    describe('Test cyclewayOnHighwayBetweenLanes (Angstweiche)', function()
      it('Both, "Angstweiche" (based on cycleway:lanes) AND "Schutzstreifen"', function()
        local input_object = {
          tags = {
            highway = 'tertiary',
            ['cycleway:right'] = 'lane',
            ['cycleway:right:lane'] = 'exclusive',
            -- The first `|lane|` is `cyclewayOnHighwayBetweenLanes`
            -- The second `|lane` is `cyclewayOnHighway_exclusive`
            ['cycleway:lanes'] = 'no|no|no|lane|no|lane',
            ['cycleway:right:traffic_sign'] = 'DE:237'
          },
          id = 1,
          type = 'way'
        }
        local categorized = extractCategoriesBySide(input_object)
        assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
        assert.are.equal(categorized.right.category.id, 'cyclewayOnHighway_exclusive')
        assert.are.equal(categorized.right.tags.traffic_sign, 'DE:237')
        assert.are.equal(categorized.left.category, nil)
      end)

      it('Both, "Angstweiche" (based on bicycle:lanes) AND "Schutzstreifen"', function()
        local input_object = {
          tags = {
            highway = 'tertiary',
            ['cycleway:right'] = 'lane',
            ['cycleway:right:lane'] = 'exclusive',
            -- The first `|designated|` is `cyclewayOnHighwayBetweenLanes`
            -- The second `|designated` is `cyclewayOnHighway_exclusive`
            ['bicycle:lanes'] = 'no|no|no|designated|no|designated',
            ['cycleway:right:traffic_sign'] = 'DE:237'
          },
          id = 1,
          type = 'way'
        }
        local categorized = extractCategoriesBySide(input_object)
        assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
        assert.are.equal(categorized.right.category.id, 'cyclewayOnHighway_exclusive')
        assert.are.equal(categorized.right.tags.traffic_sign, 'DE:237')
        assert.are.equal(categorized.left.category, nil)
      end)

      it('Only "Angstweiche" based on cycleway:lanes; also test extracting values from lanes', function()
        local input_object = {
          tags = {
            highway = 'tertiary',
            ['cycleway:right'] = 'lane',
            ['cycleway:right:lane'] = 'exclusive', -- No effect
            -- The first `|lane|` is `cyclewayOnHighwayBetweenLanes`
            -- There is no second `|lane` which would be `cyclewayOnHighway_exclusive`
            ['cycleway:lanes'] = 'no|no|no|lane|no',
            -- Extract values from *:lanes, specified in `BikelaneCategories`=>`cyclewayOnHighwayBetweenLanes`=>process
            ['width:lanes'] = '|||1.5|',
            ['surface:lanes'] = '|||foo|',
            ['surface:colour:lanes'] = '|||pink|',
            ['smoothness:lanes'] = 'a|b|c|great|d',
            ['source:width:lanes'] = 'a|b|c|Lorem Ipsum|d',
          },
          id = 1,
          type = 'way'
        }
        local categorized = extractCategoriesBySide(input_object)
        assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
        assert.are.equal(categorized.self.tags.width, '1.5')
        assert.are.equal(categorized.self.tags.surface, 'foo')
        assert.are.equal(categorized.self.tags['surface:colour'], 'pink')
        assert.are.equal(categorized.self.tags.smoothness, 'great')
        assert.are.equal(categorized.self.tags['source:width'], 'Lorem Ipsum')
        assert.are.equal(categorized.right.category, nil)
        assert.are.equal(categorized.left.category, nil)
      end)

      it('Only "Angstweiche" based on cycleway:lanes', function()
        local input_object = {
          tags = {
            highway = 'tertiary',
            ['cycleway:right'] = 'lane',
            ['cycleway:right:lane'] = 'exclusive', -- No effect
            -- The first `|designated|` is `cyclewayOnHighwayBetweenLanes`
            -- There is no second `|designated` which would be `cyclewayOnHighway_exclusive`
            ['bicycle:lanes'] = 'no|no|no|designated|no',
          },
          id = 1,
          type = 'way'
        }
        local categorized = extractCategoriesBySide(input_object)
        assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
        assert.are.equal(categorized.right.category, nil)
        assert.are.equal(categorized.left.category, nil)
      end)

      -- TBD: We dont support the forward/backward logic for this kind of data, yet.
      -- TBD: See https://github.com/FixMyBerlin/private-issues/issues/2791
      -- it('Handle forward/backward values', function()
      --   local input_object = {
      --     tags = {
      --       highway = 'tertiary',
      --       ['cycleway:right'] = 'lane',
      --       ['bicycle:lanes:forward'] = 'no|designated|no', -- index 2
      --       ['bicycle:lanes:backward'] = 'no|no|designated|no', -- index 3
      --       -- Extract values from *:lanes, specified in `BikelaneCategories`=>`cyclewayOnHighwayBetweenLanes`=>process
      --       ['width:lanes:forward'] = '|11|',
      --       ['width:lanes:backward'] = '||22|',
      --       ['surface:lanes'] = '|||foo|',
      --     },
      --     id = 1,
      --     type = 'way'
      --   }
      --   local categorized = extractCategoriesBySide(input_object)
      --   assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
      --   assert.are.equal(categorized.self.tags.width, '11')
      --   assert.are.equal(categorized.right.category, nil)
      --   assert.are.equal(categorized.left.category, nil)
      -- end)

      it('https://www.openstreetmap.org/way/1133761836 creates two categories', function()
        local input_object = {
          tags = {
            highway = 'secondary',
            dual_carriageway = 'yes',
            foot = 'use_sidepath',
            lanes = 4,
            lit = 'yes',
            maxspeed = 50,
            name = 'Holzmarktstraße',
            oneway = 'yes',
            sidewalk_left = 'no',
            sidewalk_right = 'separate',
            smoothness = 'good',
            surface = 'asphalt',
            ['turn:lanes'] = 'left|through|through|through|right|right',
            ['vehicle:lanes'] = 'yes|yes|yes|no|yes|no',
            ['bicycle:lanes'] = 'no|no|no|designated|yes|designated', -- IMPORTANT
            ['cycleway:lanes'] = 'no|no|no|lane|no|lane', -- IMPORTANT
            ['cycleway:left'] = 'no',
            ['cycleway:right'] = 'lane', -- IMPORTANT
            ['cycleway:right:lane'] = 'exclusive', -- Applied to "right"
            ['cycleway:right:width'] = '1.8' -- Applied to "right"
          },
          id = 1,
          type = 'way'
        }
        local categorized = extractCategoriesBySide(input_object)
        assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
        assert.are.equal(categorized.self.tags.width, nil)
        assert.are.equal(categorized.right.category.id, 'cyclewayOnHighway_exclusive')
        assert.are.equal(categorized.right.tags.width, '1.8')
        assert.are.equal(categorized.left.category.id, 'data_no')
      end)

      it('https://www.openstreetmap.org/way/1138392687/history/5 creates one category', function()
        local input_object = {
          tags = {
            highway = 'tertiary',
            foot = 'use_sidepath',
            lanes = 3,
            lit = 'yes',
            maxspeed = 50,
            oneway = 'yes',
            surface = 'asphalt',
            ['sidewalk:left'] = 'no',
            ['sidewalk:right'] = 'separate',
            ['turn:lanes'] = 'left|through|through|right',
            ['vehicle:lanes'] = 'yes|yes|no|yes',
            ['bicycle:lanes'] = 'yes|no|designated|yes', -- IMPORTANT
            ['cycleway:lanes'] = 'no|no|lane|no', -- IMPORTANT
            ['cycleway:left'] = 'no',
            ['cycleway:right'] = 'lane', -- INGORED (no |lane or |designated at the end of the *:lanes tags)
            ['cycleway:right:lane'] = 'advisory',
            ['cycleway:right:oneway'] = 'yes', -- IGNORED
            ['cycleway:right:separation:left'] = 'no',
            ['cycleway:right:surface'] = 'asphalt',
            ['cycleway:right:surface:colour'] = 'red',
            ['cycleway:right:traffic:sign'] = 'none',
            ['cycleway:right:width'] = '1.25'
          },
          id = 1,
          type = 'way'
        }
        local categorized = extractCategoriesBySide(input_object)
        assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
        assert.are.equal(categorized.right.category, nil)
        assert.are.equal(categorized.left.category.id, 'data_no')
      end)
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
      local result = Bikelanes(input_object.tags, input_object)
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
          ['cycleway:right:separation:left'] = 'no',
          ['cycleway:left:separation:left'] = 'vertical_panel',
          -- ['cycleway:left:traffic_mode:right'] = 'motor_vehicle'
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      for _, v in pairs(result) do
        if v._side == 'right' and v.prefix == 'cycleway' then
          -- Any `cycleway:(nil|both|right)` creates a transformed geometry for `right` which will fall back to `needsClarification` if no other tags are given
          assert.are.equal("needsClarification", v.category)
        end
        if v._side == 'left' and v.prefix == 'cycleway' then
          assert.are.equal("cyclewayOnHighwayProtected", v.category)
        end
      end
    end)

    it('Categories for protected bikelanes (only left)', function()
      local input_object = {
        highway = 'primary',
        tags = {
          ['cycleway:left'] = 'lane',
          ['cycleway:left:separation:left'] = 'bollard'
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      for _, v in pairs(result) do
        assert.are.equal('left', v._side) -- no 'right' side
        if v._side == 'left' and v.prefix == 'cycleway' then
          assert.are.equal('cyclewayOnHighway_advisoryOrExclusive', v.category)
        end
      end
    end)
  end)

  describe('Handle driveTrafficMode', function()
    it('apply nothing for invalide categories', function()
      local input_object = {
        tags = {
          highway = 'primary',
          ['cycleway:right'] = 'track',
          ['cycleway:right:segregated'] = 'yes',
          ['cycleway:right:traffic_mode:right'] = 'foot',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal(result[1].category, 'footAndCyclewaySegregated_adjoining')
      assert.are.equal(result[1].traffic_mode_left, nil)
      assert.are.equal(result[1].traffic_mode_right, 'foot')
    end)

    it('apply both parking for bicycle road', function()
      local input_object = {
        tags = {
          highway = 'cycleway',
          bicycle_road = 'yes',
          ['parking:right'] = 'street_side',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal(result[1].category, 'bicycleRoad')
      assert.are.equal(result[1].traffic_mode_left, nil)
      assert.are.equal(result[1].traffic_mode_right, 'parking')
    end)

    it('apply parking for bicycle lane', function()
      local input_object = {
        tags = {
          highway = 'primary',
          ['cycleway:left'] = 'lane',
          ['cycleway:left:lane'] = 'advisory',
          ['parking:left'] = 'street_side',
        },
        id = 1,
        type = 'way'
      }
      local result = Bikelanes(input_object.tags, input_object)
      assert.are.equal(result[1].category, 'cyclewayOnHighway_advisory')
      assert.are.equal(result[1].traffic_mode_left, nil)
      assert.are.equal(result[1].traffic_mode_right, 'parking')
    end)
  end)

end)
