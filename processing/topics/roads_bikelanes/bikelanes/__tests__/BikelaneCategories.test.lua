describe("`BikelaneCategories`", function()
  require('init')
  require("osm2pgsql")
  require("BikelaneCategories")
  require('Log')
  require('transformations')
  local extractCategoriesBySide = require('extractCategoriesBySide')

  describe('`footAndCyclewaySegregated`:', function()
    it('`hw=cycleway` should get the category', function()
      local tags = {
        ["highway"] = 'cycleway',
        ["traffic_sign"] = 'DE:241',
      }
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'footAndCyclewaySegregated_adjoiningOrIsolated')
    end)

    -- Case: https://www.openstreetmap.org/way/210889264
    --       https://www.openstreetmap.org/way/210889264/history/9
    -- The foot- and cycleway are mapped separately but both have the traffic_sign, which is valid.
    -- We now ignore those geometries and hope that the cycleway actually was mapped separately.
    it('`hw=footway` should not get the category', function()
      local tags = {
        ["highway"] = 'footway',
        ["traffic_sign"] = 'DE:241',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)
  end)

  describe('`footAndCyclewayShared` with highway=service:', function()
    it('should get the category for service road with bicycle=designated, foot=designated, segregated=no', function()
      local tags = {
        ["bicycle"] = 'designated',
        ["foot"] = 'designated',
        ["highway"] = 'service',
        ["motor_vehicle"] = 'no',
        ["segregated"] = 'no',
        ["service"] = 'emergency_access',
      }
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'footAndCyclewayShared_isolated')
    end)
  end)

  describe('`cyclewaySeparated`:', function()
    it('cycleway with sign', function()
      local tags = {
        ["highway"] = 'cycleway',
        ["traffic_sign"] = 'DE:237',
      }
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'cycleway_adjoiningOrIsolated')
    end)
    it('cycleway with sign but lane', function()
      local tags = {
        -- Those are the transformed tags
        ["highway"] = 'cycleway',
        ["cycleway"] = 'lane',
        ["traffic_sign"] = 'DE:237',
      }
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'cyclewayOnHighway_advisoryOrExclusive')
    end)
    it('cycleway isolated', function()
      local tags = {
        ["highway"] = 'cycleway',
        ["is_sidepath"] = 'yes',
      }
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'cycleway_adjoining')
    end)
    it('cycleway adjoining', function()
      local tags = {
        ["highway"] = 'cycleway',
        ["is_sidepath"] = 'no',
      }
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'cycleway_isolated')
    end)
  end)

  describe('`needsClarification`:', function()
    it('cw=shared is ignored', function()
      local tags = {
        ["highway"] = 'cycleway',
        ["cycleway"] = 'shared',
      }
      -- Log(CategorizeBikelane(tags))
      assert.are.equal(CategorizeBikelane(tags), nil)
    end)

    it('footway + bicycle=designated', function()
      local tags = {
        ["highway"] = 'footway',
        ["bicycle"] = 'designated',
      }
      -- Log(CategorizeBikelane(tags))
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'needsClarification')
    end)

    it('path + bicycle=designated', function()
      local tags = {
        ["highway"] = 'path',
        ["bicycle"] = 'designated',
      }
      -- Log(CategorizeBikelane(tags))
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'needsClarification')
    end)
  end)

  describe('`cyclewayOnHighwayProtected`:', function()
    it('works', function()
      local tags = {
        ['highway'] = 'cycleway',
        ['is_sidepath'] = 'yes',
        ['separation:left'] = 'bollard',
      }
      -- Log(CategorizeBikelane(tags))
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'cyclewayOnHighwayProtected')
    end)

    it('but not for Hochboardradwege', function()
      local tags = {
        ['highway'] = 'cycleway',
        ['is_sidepath'] = 'yes',
        ['separation:left'] = 'kerb',
      }
      -- Log(CategorizeBikelane(tags))
      local category = CategorizeBikelane(tags).id
      assert.are.equal(category, 'cycleway_adjoining')
    end)

    -- Test case based on https://www.openstreetmap.org/way/80706109
    -- This has cycleway:left:lane=advisory, so it should NOT be PBL (excluded by advisory check)
    it('should not be PBL when lane=advisory even with physical separation', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:left'] = 'lane',
          ['cycleway:left:lane'] = 'advisory',
          ['cycleway:left:separation:left'] = 'vertical_panel',
          ['bicycle:lanes:backward'] = 'designated|no|yes', -- does nothing
          ['cycleway:lanes:backward'] = 'lane|no|no', -- does nothing
        },
        id = 1,
        type = 'way'
      }
      local categorized = extractCategoriesBySide(input_object)
      assert.are.equal(categorized.left.category.id, 'cyclewayOnHighway_advisory')
    end)

    -- Test case with exclusive lane and physical separation, without :backward on lanes
    -- This should be PBL if traffic_mode:right is not motor_vehicle
    it('should be PBL with exclusive lane and physical separation when traffic_mode:right is not motor_vehicle', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'exclusive',
          ['cycleway:right:separation:left'] = 'vertical_panel',
          ['bicycle:lanes'] = 'no|designated|no|yes',
          ['cycleway:lanes'] = 'no|lane|no|no',
        },
        id = 1,
        type = 'way'
      }
      local categorized = extractCategoriesBySide(input_object)
      -- Should be PBL because separation:left exists and traffic_mode:right is nil (not motor_vehicle)
      assert.are.equal(categorized.right.category.id, 'cyclewayOnHighwayProtected')
      -- And this is not rendered (?)
      assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
    end)

    it('should be only(!) cyclewayOnHighwayBetweenLanes when separation:left=<protection> but traffic_mode:right=motor_vehicle', function()
      local input_object = {
        tags = {
          highway = 'tertiary',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'exclusive',
          ['cycleway:right:separation:left'] = 'vertical_panel',
          ['cycleway:right:traffic_mode:right'] = 'motor_vehicle',
          ['bicycle:lanes'] = 'no|designated|no|yes',
          ['cycleway:lanes'] = 'no|lane|no|no',
        },
        id = 1,
        type = 'way'
      }
      local categorized = extractCategoriesBySide(input_object)
      -- Log(categorized)
      assert.are.equal(categorized.left.category, nil)
      assert.are.equal(categorized.right.category, nil)
      assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
    end)

    it('should not be PBL when segregated=yes is present even with separation:left=bollard', function()
      -- Test case: path with segregated=yes and separation:left=bollard
      -- The separation:left condition should NOT trigger because segregated=yes indicates
      -- infrastructure not on the road ("Seitenraum")
      local tags = {
        ['bicycle'] = 'designated',
        ['foot'] = 'designated',
        ['highway'] = 'path',
        ['is_sidepath'] = 'yes',
        ['segregated'] = 'yes',
        ['separation:left'] = 'bollard',
      }
      local category = CategorizeBikelane(tags)
      -- When segregated=yes is present, separation:left should not trigger PBL
      -- With segregated=yes, it should match footAndCyclewaySegregated instead
      assert.are.equal(category.id, 'footAndCyclewaySegregated_adjoining')
    end)
  end)

  describe('`footwayBicycleYes` with mtb:scale conditions:', function()
    it('should return footwayBicycleYes when mtb:scale is nil', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoiningOrIsolated')
    end)

    it('should return nil when mtb:scale is "0" without traffic_sign or is_sidepath', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '0',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when mtb:scale is "not_number"', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = 'not_number',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when mtb:scale is "0+" without traffic_sign or is_sidepath', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '0+',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should return footwayBicycleYes when mtb:scale is "0-" with traffic_sign', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '0-',
        ['traffic_sign'] = 'DE:1022-10',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoiningOrIsolated')
    end)

    it('should return footwayBicycleYes when mtb:scale is "+0" with is_sidepath', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '+0',
        ['is_sidepath'] = 'yes',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoining')
    end)

    it('should return nil when mtb:scale is "unknown"', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = 'unknown',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should return footwayBicycleYes when mtb:scale is 0 with traffic_sign', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = 0,
        ['traffic_sign'] = 'DE:1022-10',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoiningOrIsolated')
    end)

    it('should return footwayBicycleYes when mtb:scale is "0" with traffic_sign', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '0',
        ['traffic_sign'] = 'DE:1022-10',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoiningOrIsolated')
    end)

    it('should return footwayBicycleYes when mtb:scale is "0" with is_sidepath', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '0',
        ['is_sidepath'] = 'yes',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoining')
    end)

    it('should return nil when mtb:scale is "0" without traffic_sign or is_sidepath', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '0',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when mtb:scale is "1"', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '1',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should work with path highway and mtb:scale is 0 with is_sidepath', function()
      local tags = {
        ['highway'] = 'path',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = 0,
        ['is_sidepath'] = 'yes',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result.id, 'footwayBicycleYes_adjoining')
    end)

    it('should work with path highway and mtb:scale >= "3"', function()
      local tags = {
        ['highway'] = 'path',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = '3',
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)

    it('should return nil when mtb:scale is 0 but no traffic_sign or is_sidepath', function()
      local tags = {
        ['highway'] = 'footway',
        ['bicycle'] = 'yes',
        ['mtb:scale'] = 0,
      }
      local result = CategorizeBikelane(tags)
      assert.are.equal(result, nil)
    end)
  end)

  describe('`crossing` category:', function()
    it('should categorize cycleway:right=lane + cycleway:right:lane=crossing as crossing', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:left'] = 'no',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'crossing',
        },
        id = 1,
        type = 'way'
      }

      local categories = extractCategoriesBySide(input_object)

      -- Test right category - should be crossing, not cyclewayOnHighway_advisoryOrExclusive
      assert.are.equal(categories.right.category.id, 'crossing')
      assert.are.equal(categories.right.tags.highway, 'cycleway')
      assert.are.equal(categories.right.tags.cycleway, 'lane')
      assert.are.equal(categories.right.tags.lane, 'crossing')
    end)
  end)

  describe('`sharedBus*` categories', function()
    it('Create one shared bus category when both `share_busway` and traffic_sign are given', function()
      -- https://www.openstreetmap.org/way/461840225
      -- Create input object for the helper
      local input_object = {
        tags = {
          ['cycleway:left'] = 'no',
          ['cycleway:right'] = 'share_busway',
          ['dual_carriageway'] = 'yes',
          -- ['foot'] = 'use_sidepath',
          ['highway'] = 'primary_link',
          ['lanes'] = '3',
          ['lanes:psv'] = '1',
          -- ['lit'] = 'yes',
          -- ['mapillary'] = '2168167686701777',
          -- ['maxspeed'] = '50',
          -- ['name'] = 'Friedenstraße',
          -- ['name:etymology:wikidata'] = 'Q39614',
          -- ['oneway'] = 'yes',
          -- ['parking:both'] = 'no',
          -- ['postal_code'] = '12107',
          ['psv:lanes'] = 'yes|yes|designated',
          -- ['ref'] = 'B 101',
          ['sidewalk:left'] = 'no',
          ['sidewalk:right'] = 'separate',
          -- ['smoothness'] = 'good',
          -- ['surface'] = 'asphalt',
          ['traffic_sign'] = 'DE:245,1022-10',
          ['turn:lanes'] = 'right|right|right',
          -- ['width'] = '10',
        },
        id = 1,
        type = 'way'
      }

      local categories = extractCategoriesBySide(input_object)

      -- Test self category
      assert.are.equal(categories.self.category, nil)
      assert.are.equal(categories.self.tags.highway, 'primary_link')
      assert.are.equal(categories.self.tags.traffic_sign, 'DE:245,1022-10')

      -- Test left category
      assert.are.equal(categories.left.category.id, 'data_no')
      assert.are.equal(categories.left.tags.highway, 'cycleway')
      assert.are.equal(categories.left.tags.cycleway, 'no')
      assert.are.equal(categories.left.tags.traffic_sign, nil)
      assert.are.equal(categories.left.tags._parent.traffic_sign, 'DE:245,1022-10')

      -- Test right category
      assert.are.equal(categories.right.category.id, 'sharedBusLaneBusWithBike')
      assert.are.equal(categories.right.tags.highway, 'cycleway')
      assert.are.equal(categories.right.tags.cycleway, 'share_busway')
      assert.are.equal(categories.right.tags.traffic_sign, 'DE:245,1022-10')
      assert.are.equal(categories.right.tags._parent.traffic_sign, 'DE:245,1022-10')
    end)

    it('should be sharedBusLaneBusWithBike and NOT cyclewayOnHighwayProtected when share_busway has physical separation', function()
      local input_object = {
        tags = {
          ['cycleway:left'] = 'no',
          ['cycleway:right'] = 'share_busway',
          ['cycleway:right:buffer'] = 'no',
          ['cycleway:right:oneway'] = 'yes',
          ['cycleway:right:separation:left'] = 'vertical_panel',
          ['dual_carriageway'] = 'yes',
          ['highway'] = 'primary',
          ['name'] = 'Spittelmarkt',
          ['oneway'] = 'yes',
        },
        id = 1,
        type = 'way'
      }

      local categories = extractCategoriesBySide(input_object)

      -- Right category should be sharedBusLaneBusWithBike, NOT cyclewayOnHighwayProtected
      assert.are.equal(categories.right.category.id, 'sharedBusLaneBusWithBike')
      assert.are.equal(categories.right.tags.highway, 'cycleway')
      assert.are.equal(categories.right.tags.cycleway, 'share_busway')
      assert.are.equal(categories.right.tags['separation:left'], 'vertical_panel')
    end)
  end)

  describe('`cyclewayOnHighway*`', function()
    it('Take with `cycleway:right:width` when given', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:lanes'] = 'no|lane|no|lane',
          ['width:lanes'] = '|11||99',
          ['cycleway:left'] = 'no',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'advisory',
          ['cycleway:right:width'] = '55',
        },
        id = 1,
        type = 'way'
      }
      local categorized = extractCategoriesBySide(input_object)

      assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
      assert.are.equal(categorized.self.tags.width, '11')

      assert.are.equal(categorized.left.category.id, 'data_no')

      assert.are.equal(categorized.right.category.id, 'cyclewayOnHighway_advisory')
      assert.are.equal(categorized.right.tags.width, '55')
    end)

    it('Take with `width:lanes` when none given', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:lanes'] = 'no|lane|no|lane',
          ['width:lanes'] = '|11||44',
          ['cycleway:left'] = 'no',
          ['cycleway:right'] = 'lane',
          ['cycleway:right:lane'] = 'advisory',
          -- ['cycleway:right:width'] = '55',
        },
        id = 1,
        type = 'way'
      }
      local categorized = extractCategoriesBySide(input_object)

      assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
      assert.are.equal(categorized.self.tags.width, '11')

      assert.are.equal(categorized.left.category.id, 'data_no')

      assert.are.equal(categorized.right.category.id, 'cyclewayOnHighway_advisory')
      assert.are.equal(categorized.right.tags.width, '44')
    end)

    it('But only take `width:lane` when actual Schutzstreifen', function()
      local input_object = {
        tags = {
          ['highway'] = 'secondary',
          ['cycleway:lanes'] = 'no|lane|no',
          ['width:lanes'] = '11|12|13',
          ['cycleway:left'] = 'no',
          ['cycleway:right'] = 'lane',
        },
        id = 1,
        type = 'way'
      }
      local categorized = extractCategoriesBySide(input_object)

      assert.are.equal(categorized.self.category.id, 'cyclewayOnHighwayBetweenLanes')
      assert.are.equal(categorized.self.tags.width, '12')

      assert.are.equal(categorized.left.category.id, 'data_no')

      assert.are.equal(categorized.right.category, nil)
      assert.are.equal(categorized.right.tags.width, nil)
    end)
  end)

  describe('Richard-von-Weizsäcker-Platz test case:', function()
    it('should categorize left as crossing (even with physical separation) and right as cyclewayOnHighwayProtected, self should have no category', function()
      local input_object = {
        tags = {
          ['cycleway:both'] = 'lane',
          ['cycleway:left:buffer'] = 'no',
          ['cycleway:left:lane'] = 'crossing',
          ['cycleway:left:marking:left'] = 'dashed_line',
          ['cycleway:left:traffic_sign'] = 'DE:237',
          ['cycleway:right:buffer'] = 'no',
          ['cycleway:right:lane'] = 'exclusive',
          ['cycleway:right:marking:left'] = 'dashed_line',
          ['cycleway:right:separation:right'] = 'kerb;bollard',
          ['highway'] = 'secondary',
        },
        id = 1,
        type = 'way'
      }

      local categorized = extractCategoriesBySide(input_object)
      assert.are.equal(categorized.self.category, nil)

      -- Left should be categorized as crossing (excluded from PBL even with physical separation)
      assert.are.equal(categorized.left.category.id, 'crossing')
      assert.are.equal(categorized.left.tags.highway, 'cycleway')
      assert.are.equal(categorized.left.tags.cycleway, 'lane')
      assert.are.equal(categorized.left.tags.lane, 'crossing')
      assert.are.equal(categorized.left.tags.traffic_sign, 'DE:237')

      assert.are.equal(categorized.right.category.id, 'cyclewayOnHighway_exclusive')
      assert.are.equal(categorized.right.tags.highway, 'cycleway')
      assert.are.equal(categorized.right.tags.cycleway, 'lane')
      assert.are.equal(categorized.right.tags.lane, 'exclusive')
      assert.are.equal(categorized.right.tags['separation:right'], 'kerb;bollard')
    end)
  end)
end)
