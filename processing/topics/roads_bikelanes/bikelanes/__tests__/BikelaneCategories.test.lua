describe("`BikelaneCategories`", function()
  require('init')
  require("osm2pgsql")
  require("BikelaneCategories")
  require('Log')

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
end)
