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
  end)
end)
