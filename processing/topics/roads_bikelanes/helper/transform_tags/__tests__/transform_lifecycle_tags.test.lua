describe('transform_lifecycle_tags', function()
  require('init')
  require('Log')
  local transform_lifecycle_tags = require('transform_lifecycle_tags')

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
    it('transforms access=no with "Sperrung" in note', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung „bis auf Weiteres" an israelischen Botschaft'
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'blocked',
        description = 'TILDA-Hinweis: Weg gesperrt (Sperrung).',
        note = 'Sperrung „bis auf Weiteres" an israelischen Botschaft'
      })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil
      })
    end)

    it('transforms access=no with "GESPERRT" in description, case-insensitive', function()
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
end)
