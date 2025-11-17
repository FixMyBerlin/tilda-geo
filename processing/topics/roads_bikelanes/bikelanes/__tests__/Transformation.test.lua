describe("Bikelanes", function()
  require('init')
  require('Log')
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

  -- TBD: See https://github.com/FixMyBerlin/private-issues/issues/2791
  -- describe('Handle `*:lanes`', function()
  --   it('lanes on for cyclewayOnHighwayBetweenLanes as specified in `directedTags`', function()
  --     local input_tags = {
  --       highway = 'tertiary',
  --       ['cycleway:right'] = 'lane',
  --       ['cycleway:lanes'] = 'no|no|no|lane|no|lane',
  --       ['width:lanes:forward'] = '1|2|3',
  --       ['width:lanes:backward'] = 'foo|bar',
  --     }
  --     local results = GetTransformedObjects(input_tags, { cyclewayTransformation })
  --     local self = results[1]
  --     assert.are.equal(self.highway, 'tertiary')
  --     assert.are.equal(self['width:lanes:forward'], '1|2|3') -- not changed
  --     assert.are.equal(self['width:lanes:backward'], 'foo|bar') -- not changed

  --     local left = results[2]
  --     assert.are.equal(left.highway, 'cycleway')
  --     assert.are.equal(left['width:lanes'], 'foo|bar')

  --     local right = results[3]
  --     assert.are.equal(right.highway, 'cycleway')
  --     assert.are.equal(right['width:lanes'], '1|2|3')
  --   end)
  -- end)

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
      local result_self = results[1]
      local result_left = results[2]
      assert.are.equal(result_left.traffic_sign, traffic_sign)
      assert.are.equal(result_self.traffic_sign, nil)
    end)

    it('traffic_sign on bikelanes', function()
      local traffic_sign = 'DE:237'
      local input_tags = {
          highway = 'primary',
          ['cycleway:left:traffic_sign:forward'] = traffic_sign,
      }
      local results = GetTransformedObjects(input_tags, {cyclewayTransformation})
      local result_self = results[1]
      local result_left = results[2]
      assert.are.equal(result_left.traffic_sign, traffic_sign)
      assert.are.equal(result_self.traffic_sign, nil)
    end)
  end)

  describe('Handle meta-prefixed tags (`source:` and `note:`)', function()
    it('unnests source:cycleway:*:width to source:width with hierarchy (side > both > general)', function()
      local input_tags = {
        highway = 'primary',
        ['cycleway:left'] = 'lane',
        ['source:cycleway:width'] = 'general',
        ['source:cycleway:both:width'] = 'both',
        ['source:cycleway:left:width'] = 'side',
      }
      local results = GetTransformedObjects(input_tags, {cyclewayTransformation})
      local result_left = results[2]
      -- side-specific should win (hierarchy: side > both > general)
      assert.are.equal(result_left['source:width'], 'side')
    end)

    it('unnests source:sidewalk:*:width to source:width for sidewalk transformation', function()
      local input_tags = {
        highway = 'primary',
        ['sidewalk:left'] = 'yes',
        ['source:sidewalk:width'] = 'general',
        ['source:sidewalk:both:width'] = 'both',
        ['source:sidewalk:left:width'] = 'side',
      }
      local results = GetTransformedObjects(input_tags, {footwayTransformation})
      local result_left = results[2]
      -- side-specific should win (hierarchy: side > both > general)
      assert.are.equal(result_left['source:width'], 'side')
    end)

    it('unnests note:cycleway:* to note with hierarchy', function()
      local input_tags = {
        highway = 'primary',
        ['cycleway:left'] = 'lane',
        ['note:cycleway'] = 'general',
        ['note:cycleway:both'] = 'both',
        ['note:cycleway:left'] = 'side',
      }
      local results = GetTransformedObjects(input_tags, {cyclewayTransformation})
      local result_left = results[2]
      -- side-specific should win (hierarchy: side > both > general)
      assert.are.equal(result_left.note, 'side')
    end)

    it('meta-prefixed tags overwrite regular tags (no priority preservation)', function()
      local input_tags = {
        highway = 'primary',
        ['cycleway:left'] = 'lane',
        ['cycleway:left:source:width'] = 'direct_value',
        ['source:cycleway:left:width'] = 'meta_prefixed_value',
      }
      local results = GetTransformedObjects(input_tags, {cyclewayTransformation})
      local result_left = results[2]
      -- meta-prefixed tags are processed after and overwrite regular tags
      assert.are.equal(result_left['source:width'], 'meta_prefixed_value')
    end)

    it('unnests source:cycleway:width (general, no side) to source:width', function()
      local input_tags = {
        highway = 'primary',
        ['cycleway:left'] = 'lane',
        ['source:cycleway:width'] = 'infra3D',
      }
      local results = GetTransformedObjects(input_tags, {cyclewayTransformation})
      local result_left = results[2]
      -- general source:cycleway:width should be transformed to source:width
      assert.are.equal(result_left['source:width'], 'infra3D')
    end)

    it('unnests source:sidewalk:width (general, no side) to source:width', function()
      local input_tags = {
        highway = 'primary',
        ['sidewalk:left'] = 'yes',
        ['source:sidewalk:width'] = 'infra3D',
      }
      local results = GetTransformedObjects(input_tags, {footwayTransformation})
      local result_left = results[2]
      -- general source:sidewalk:width should be transformed to source:width
      assert.are.equal(result_left['source:width'], 'infra3D')
    end)
  end)
end)
