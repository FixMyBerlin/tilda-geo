describe('transform_lifecycle_tags', function()
  local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')
  local maxspeed = require('topics.roads_bikelanes.maxspeed.maxspeed')
  local DESC = require('topics.helper.tilda_description')
  local extract_public_tags = require('topics.helper.extract_public_tags')

  describe('construction tags transformation', function()
    it('transforms highway=construction with valid construction tag', function()
      local tags = {
        highway = 'construction',
        construction = 'residential',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        lifecycle = 'construction',
      })

      assert.are.same(unmodified_tags, {
        highway = 'construction',
        lifecycle = nil,
      })
    end)

    it('does not transform highway=construction with invalid construction tag', function()
      local tags = {
        highway = 'construction',
        construction = 'platform',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'construction',
        construction = 'platform',
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('transforms construction highway before construction access restriction', function()
      local tags = {
        highway = 'construction',
        construction = 'cycleway',
        bicycle = 'no',
        note = 'Baustelle',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'cycleway',
        lifecycle = 'construction_no_access',
        note = 'Baustelle',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_construction' })

      assert.are.same(unmodified_tags, {
        highway = 'construction',
        lifecycle = 'construction',
        bicycle = 'no',
      })
    end)
  end)

  describe('construction_no_access transformation', function()
    it('transforms access=no with construction in description', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        description = 'Weg gesperrt aufgrund einer Baustelle',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'residential',
        lifecycle = 'construction_no_access',
        description = 'Weg gesperrt aufgrund einer Baustelle',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_construction' })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil,
      })
    end)

    it('transforms cycleway bicycle=no with construction in access:reason', function()
      local tags = {
        highway = 'cycleway',
        bicycle = 'no',
        ['access:reason'] = 'construction',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'cycleway',
        lifecycle = 'construction_no_access',
        ['access:reason'] = 'construction',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_construction' })

      assert.are.same(unmodified_tags, {
        bicycle = 'no',
        lifecycle = nil,
      })
    end)

    it('transforms footway foot=no with baustelle in note', function()
      local tags = {
        highway = 'footway',
        foot = 'no',
        note = 'Baustelle',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'footway',
        lifecycle = 'construction_no_access',
        note = 'Baustelle',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_construction' })

      assert.are.same(unmodified_tags, {
        foot = 'no',
        lifecycle = nil,
      })
    end)
  end)

  describe('blocked transformation', function()
    it('transforms access=no with Sperrung in note', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung „bis auf Weiteres” an israelischen Botschaft',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'residential',
        lifecycle = 'blocked',
        note = 'Sperrung „bis auf Weiteres” an israelischen Botschaft',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_blocked' })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil,
      })
    end)

    it('transforms access=no with GESPERRT in description, case-insensitive', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        description = 'Weg ist GESPERRT',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'residential',
        lifecycle = 'blocked',
        description = 'Weg ist GESPERRT',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_blocked' })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil,
      })
    end)

    it('does not transform when no restricted tags are present', function()
      local tags = {
        highway = 'residential',
        note = 'Sperrung',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        note = 'Sperrung',
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('does not transform when restricted tags exist but no blocked terms found', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Some other reason',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        access = 'no',
        note = 'Some other reason',
      })

      assert.are.same(unmodified_tags, {})
    end)

    it('prioritizes construction_no_access over blocked when both terms are present', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung aufgrund einer Baustelle',
      }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(extract_public_tags(tags), {
        highway = 'residential',
        lifecycle = 'construction_no_access',
        note = 'Sperrung aufgrund einer Baustelle',
      })
      assert.are.same(DESC.hints(tags), { 'TILDA_closed_construction' })

      assert.are.same(unmodified_tags, {
        access = 'no',
        lifecycle = nil,
      })
    end)
  end)

  describe('temporary', function()
    it('moves temporary=yes to lifecycle=temporary', function()
      local tags = { highway = 'cycleway', temporary = 'yes' }
      local unmodified_tags = transform_lifecycle_tags(tags)

      assert.are.same(tags, { highway = 'cycleway', lifecycle = 'temporary' })
      assert.are.same(unmodified_tags, { temporary = 'yes' })
    end)

    it('moves cycleway:SIDE:temporary=yes and sidewalk:SIDE:temporary=yes to the side lifecycle', function()
      local tags = {
        highway = 'residential',
        ['cycleway:right'] = 'lane',
        ['cycleway:right:temporary'] = 'yes',
        ['cycleway:temporary'] = 'yes',
        ['sidewalk:both:temporary'] = 'yes',
      }
      transform_lifecycle_tags(tags)

      assert.are.same(tags, {
        highway = 'residential',
        ['cycleway:right'] = 'lane',
        ['cycleway:right:lifecycle'] = 'temporary',
        ['cycleway:lifecycle'] = 'temporary',
        ['sidewalk:both:lifecycle'] = 'temporary',
      })
    end)

    it('keeps an existing lifecycle', function()
      local tags = { highway = 'construction', construction = 'cycleway', temporary = 'yes' }
      transform_lifecycle_tags(tags)

      assert.are.same(tags.lifecycle, 'construction')
      assert.is_nil(tags.temporary)
    end)

    it('ignores temporary=no', function()
      local tags = { highway = 'cycleway', temporary = 'no' }
      transform_lifecycle_tags(tags)

      assert.are.same(tags, { highway = 'cycleway', temporary = 'no' })
    end)
  end)

  describe('interaction with maxspeed inference', function()
    it('treats construction=living_street as living_street for maxspeed fallback after transform', function()
      local tags = {
        highway = 'construction',
        construction = 'living_street',
      }

      local before_transform = maxspeed(tags)
      assert.are.same(before_transform.maxspeed_source, nil)
      assert.are.same(before_transform.maxspeed_confidence, nil)
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
