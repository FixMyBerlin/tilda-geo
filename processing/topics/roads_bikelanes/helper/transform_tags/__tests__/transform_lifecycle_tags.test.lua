describe('transform_lifecycle_tags', function()
  local log = require('topics.helper.log')
  local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')
  local maxspeed = require('topics.roads_bikelanes.maxspeed.maxspeed')

  describe('construction tags transformation', function()
    it('transforms highway=construction with valid construction tag', function()
      local tags = {
        highway = 'construction',
        construction = 'residential'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'construction'
      })

      assert.are.same(unmodified_tags, {
        highway = 'construction',
        lifecycle = nil
      })
    end)
  end)

  describe('construction_no_access transformation', function()
    it('transforms access=no with construction in description', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        description = 'Weg gesperrt aufgrund einer Baustelle'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'construction_no_access',
        description = 'TILDA-Hinweis: Weg gesperrt aufgrund einer Baustelle.;Weg gesperrt aufgrund einer Baustelle'
      })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil
      })
    end)
  end)

  describe('blocked transformation - German terms', function()
    it('transforms access=no with Sperrung in note', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung „bis auf Weiteres” an israelischen Botschaft'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'blocked',
        description = 'TILDA-Hinweis: Weg gesperrt (Sperrung).',
        note = 'Sperrung „bis auf Weiteres” an israelischen Botschaft'
      })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil
      })
    end)

    it('transforms access=no with GESPERRT in description, case-insensitive', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        description = 'Weg ist GESPERRT'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'blocked',
        description = 'TILDA-Hinweis: Weg gesperrt (Sperrung).;Weg ist GESPERRT'
      })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil
      })
    end)

    it('does not transform when no restricted tags are present', function()
      local tags = {
        highway = 'residential',
        note = 'Sperrung'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        note = 'Sperrung'
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('does not transform when restricted tags exist but no blocked terms found', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Some other reason'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        access = 'no',
        note = 'Some other reason'
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('prioritizes construction_no_access over blocked when both terms are present', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung aufgrund einer Baustelle'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      -- Should match construction_no_access first (checked earlier in the function)
      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'construction_no_access',
        description = 'TILDA-Hinweis: Weg gesperrt aufgrund einer Baustelle.',
        note = 'Sperrung aufgrund einer Baustelle'
      })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil
      })
    end)
  end)

  describe('interaction with maxspeed inference', function()
    it('treats construction=living_street as living_street for maxspeed fallback after transform', function()
      local tags = {
        highway = 'construction',
        construction = 'living_street',
      }

      local before_transform = maxspeed(tags)
      assert.are.same(before_transform.maxspeed_source, 'nothing_found')
      assert.are.same(before_transform.maxspeed, nil)

      transform_lifecycle_tags(tags)

      local after_transform = maxspeed(tags)
      assert.are.same(tags.highway, 'living_street')
      assert.are.same(tags.lifecycle, 'construction')
      assert.are.same(after_transform.maxspeed_source, 'inferred_from_highway')
      assert.are.same(after_transform.maxspeed_confidence, 'high')
      assert.are.same(after_transform.maxspeed, 7)
    end)
  end)
end)
