describe('bikelanes lifecycle', function()
  require('topics.helper.osm2pgsql')
  local bikelanes = require('topics.roads_bikelanes.bikelanes.extract_bikelanes')
  local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')
  local transform_cycleway_opposite_schema = require('topics.roads_bikelanes.helper.transform_tags.transform_cycleway_opposite_schema')
  local transform_construction_prefix = require('topics.roads_bikelanes.helper.transform_tags.transform_construction_prefix')
  local transform_cycleway_both_postfix = require('topics.roads_bikelanes.helper.transform_tags.transform_cycleway_both_postfix')
  local result_tags = require('topics.roads_bikelanes.helper.result_tags')

  -- Same transform order as `roads_bikelanes_ways.lua`
  ---@param tags OsmTags
  ---@return { bikelanes: table<string, OsmTags>, road: SharedResultTags }
  local function run(tags)
    tags._id = 1
    tags._type = 'way'
    transform_lifecycle_tags(tags)
    transform_cycleway_opposite_schema(tags)
    transform_construction_prefix(tags)
    transform_cycleway_both_postfix(tags)

    local by_side = {}
    for _, bikelane in ipairs(bikelanes(tags, { id = 1, type = 'way' })) do
      by_side[bikelane._side] = bikelane
    end
    return { bikelanes = by_side, road = result_tags(tags) }
  end

  describe('temporary', function()
    it('reads `temporary=yes` on a separate cycleway', function()
      local result = run({ highway = 'cycleway', temporary = 'yes' })
      assert.are.equal('temporary', result.bikelanes.self.lifecycle)
      assert.are.equal('temporary', result.road.lifecycle)
    end)

    it('reads `cycleway:right:temporary=yes` for that side only', function()
      local result = run({
        highway = 'residential',
        ['cycleway:both'] = 'lane',
        ['cycleway:right:temporary'] = 'yes',
      })
      assert.are.equal('temporary', result.bikelanes.right.lifecycle)
      assert.is_nil(result.bikelanes.left.lifecycle)
      assert.is_nil(result.road.lifecycle)
    end)

    it('reads `cycleway:temporary=yes` for both sides, not for the road', function()
      local result = run({
        highway = 'residential',
        ['cycleway:both'] = 'lane',
        ['cycleway:temporary'] = 'yes',
      })
      assert.are.equal('temporary', result.bikelanes.left.lifecycle)
      assert.are.equal('temporary', result.bikelanes.right.lifecycle)
      assert.is_nil(result.road.lifecycle)
    end)

    it('passes `temporary=yes` on the road on to the sides', function()
      local result = run({
        highway = 'residential',
        temporary = 'yes',
        ['cycleway:right'] = 'lane',
      })
      assert.are.equal('temporary', result.road.lifecycle)
      assert.are.equal('temporary', result.bikelanes.right.lifecycle)
    end)
  end)

  describe('construction (control cases)', function()
    it('reads `construction:cycleway:right=lane` for that side only', function()
      local result = run({
        highway = 'residential',
        ['construction:cycleway:right'] = 'lane',
      })
      assert.are.equal('construction', result.bikelanes.right.lifecycle)
      assert.is_nil(result.bikelanes.left)
      assert.is_nil(result.road.lifecycle)
    end)

    it('reads `construction:cycleway=lane` for both sides, not for the road', function()
      local result = run({
        highway = 'residential',
        ['construction:cycleway'] = 'lane',
      })
      assert.are.equal('construction', result.bikelanes.left.lifecycle)
      assert.are.equal('construction', result.bikelanes.right.lifecycle)
      assert.is_nil(result.road.lifecycle)
    end)

    it('reads `highway=construction` + `construction=cycleway`', function()
      local result = run({ highway = 'construction', construction = 'cycleway' })
      assert.are.equal('construction', result.bikelanes.self.lifecycle)
    end)

    it('passes the road lifecycle on to the sides', function()
      local result = run({
        highway = 'construction',
        construction = 'residential',
        ['cycleway:right'] = 'lane',
      })
      assert.are.equal('construction', result.road.lifecycle)
      assert.are.equal('construction', result.bikelanes.right.lifecycle)
    end)
  end)
end)
