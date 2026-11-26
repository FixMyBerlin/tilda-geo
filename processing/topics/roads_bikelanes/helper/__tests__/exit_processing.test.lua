describe('exit_processing', function()
  local exit_processing = require('topics.roads_bikelanes.helper.exit_processing')
  local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')

  describe('exits on normalized tags', function()
    it('exits when highway is missing', function()
      assert.is_true(exit_processing({}))
    end)

    it('exits for area=yes', function()
      assert.is_true(exit_processing({
        highway = 'residential',
        area = 'yes',
      }))
    end)

    it('leaves restricted access and service ways to access_restriction', function()
      assert.is_false(exit_processing({ highway = 'service', service = 'driveway' }))
      assert.is_false(exit_processing({ highway = 'residential', access = 'private' }))
      assert.is_false(exit_processing({ highway = 'footway', foot = 'delivery' }))
      assert.is_false(exit_processing({ highway = 'footway', indoor = 'yes' }))
      assert.is_false(exit_processing({ highway = 'path', informal = 'yes' }))
      assert.is_false(exit_processing({ highway = 'residential', access = 'no' }))
      assert.is_false(exit_processing({ highway = 'cycleway', bicycle = 'no' }))
    end)

    it('exits for disallowed highway class', function()
      assert.is_true(exit_processing({
        highway = 'proposed',
      }))
    end)
  end)

  describe('continues after lifecycle derivation changes the exit outcome', function()
    it('keeps highway=construction with valid construction tag', function()
      local tags = {
        highway = 'construction',
        construction = 'residential',
      }
      transform_lifecycle_tags(tags)

      assert.is_false(exit_processing(tags))
    end)

    it('keeps access=no with construction in description', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        description = 'Weg gesperrt aufgrund einer Baustelle',
      }
      transform_lifecycle_tags(tags)

      assert.is_false(exit_processing(tags))
    end)

    it('keeps access=no with blocked term in note', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung „bis auf Weiteres” an israelischen Botschaft',
      }
      transform_lifecycle_tags(tags)

      assert.is_false(exit_processing(tags))
    end)
  end)
end)
