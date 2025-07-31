describe('transform_construction_prefix', function()
  require('init')
  require('Log')
  local transform_construction_prefix = require('transform_construction_prefix')

  describe('basic construction prefix transformation', function()
    it('converts construction:bicycle_road to bicycle_road with lifecycle', function()
      local tags = { ['construction:bicycle_road'] = 'yes' }
      local unmodified_tags = transform_construction_prefix(tags)

      -- Check the mutated input table
      assert.are.same(tags, {
        bicycle_road = 'yes',
        lifecycle = 'construction'
      })

      -- Check the returned unmodified_tags (should be empty since no original bicycle_road existed)
      assert.are.same(unmodified_tags, {})
    end)

    it('preserves original values when overwriting existing tags', function()
      local tags = {
        ['maxspeed'] = '50',
        ['construction:maxspeed'] = '30'
      }
      local unmodified_tags = transform_construction_prefix(tags)

      -- Check the mutated input table
      assert.are.same(tags, {
        maxspeed = '30',
        lifecycle = 'construction'
      })

      -- Check the returned unmodified_tags contains the original value
      assert.are.same(unmodified_tags, {
        maxspeed = '50'
      })
    end)

    it('handles multiple construction tags', function()
      local tags = {
        ['construction:bicycle_road'] = 'yes',
        ['construction:highway'] = 'primary'
      }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        bicycle_road = 'yes',
        highway = 'primary',
        lifecycle = 'construction'
      })

      assert.are.same(unmodified_tags, {})
    end)
  end)

  describe('cycleway lifecycle tag placement', function()
    it('adds cycleway:left:lifecycle for construction:cycleway:left', function()
      local tags = { ['construction:cycleway:left'] = 'lane' }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        ['cycleway:left'] = 'lane',
        ['cycleway:left:lifecycle'] = 'construction'
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('adds cycleway:right:lifecycle for construction:cycleway:right', function()
      local tags = { ['construction:cycleway:right'] = 'track' }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        ['cycleway:right'] = 'track',
        ['cycleway:right:lifecycle'] = 'construction'
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('adds cycleway:both:lifecycle for construction:cycleway:both', function()
      local tags = { ['construction:cycleway:both'] = 'lane' }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        ['cycleway:both'] = 'lane',
        ['cycleway:both:lifecycle'] = 'construction'
      })

      assert.are.same(unmodified_tags, {})
    end)
  end)

  describe('sidewalk lifecycle tag placement', function()
    it('adds sidewalk:left:lifecycle for construction:sidewalk:left', function()
      local tags = { ['construction:sidewalk:left'] = 'yes' }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        ['sidewalk:left'] = 'yes',
        ['sidewalk:left:lifecycle'] = 'construction'
      })

      assert.are.same(unmodified_tags, {})
    end)
  end)

  describe('edge cases', function()
    it('handles empty tags table', function()
      local tags = {}
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {})
      assert.are.same(unmodified_tags, {})
    end)

    it('leaves non-construction tags unchanged', function()
      local tags = {
        highway = 'residential',
        name = 'Test Street',
        maxspeed = '30'
      }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        highway = 'residential',
        name = 'Test Street',
        maxspeed = '30'
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('handles mixed construction and regular tags', function()
      local tags = {
        highway = 'residential',
        ['construction:bicycle_road'] = 'yes',
        name = 'Test Street',
        ['construction:cycleway:left'] = 'lane'
      }
      local unmodified_tags = transform_construction_prefix(tags)

      assert.are.same(tags, {
        highway = 'residential',
        name = 'Test Street',
        bicycle_road = 'yes',
        ['cycleway:left'] = 'lane',
        lifecycle = 'construction',
        ['cycleway:left:lifecycle'] = 'construction'
      })

      assert.are.same(unmodified_tags, {})
    end)
  end)
end)
