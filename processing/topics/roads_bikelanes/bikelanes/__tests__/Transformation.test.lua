describe("Bikelanes", function()
  require('init')
  require("osm2pgsql")
  require("transformations")

  -- transformations for nested tags:
  local footwayTransformation = CenterLineTransformation.new({
    highway = "footway",
    prefix = "sidewalk",
    filter = function(tags)
      return not (tags.footway == 'no' or tags.footway == 'separate')
    end,
    direction_reference = 'parent'
  })
  local cyclewayTransformation = CenterLineTransformation.new({
    highway = "cycleway",
    prefix = "cycleway",
    direction_reference = 'self'
  })

  describe('Handle `traffic_sign`', function()
    it('traffic_sign on oneway paths', function()
      local traffic_sign = 'DE:237'
      local input_tags = {
        highway = 'path',
        oneway = 'yes',
        ['traffic_sign:forward'] = traffic_sign,
      }
      local results = GetTransformedObjects(input_tags, {})
      assert.are.equal(traffic_sign, results[1].traffic_sign)
      input_tags['oneway:bicycle'] = 'no'

      results = GetTransformedObjects(input_tags, {})
      assert.are.equal(nil, results[1].traffic_sign)
    end)

    it('traffic_sign on sidewalks', function()
      local traffic_sign = 'DE:237'
      local input_tags = {
          highway = 'primary',
          ['sidewalk:left:traffic_sign:backward'] = traffic_sign,
      }
      local results = GetTransformedObjects(input_tags, {footwayTransformation})
      for _, v in pairs(results) do
        if v._side == 'left' then
          assert.are.equal(traffic_sign, v.traffic_sign)
        else
          assert.are.equal(nil, v.traffic_sign)
        end
      end
    end)

    it('traffic_sign on bikelanes', function()
      local traffic_sign = 'DE:237'
      local input_tags = {
          highway = 'primary',
          ['cycleway:left:traffic_sign:forward'] = traffic_sign,
      }
      local results = GetTransformedObjects(input_tags, {cyclewayTransformation})
      for _, v in pairs(results) do
        if v._side == 'left' then
          assert.are.equal(traffic_sign, v.traffic_sign)
        else
          assert.are.equal(nil, v.traffic_sign)
        end
      end
    end)
  end)
end)
