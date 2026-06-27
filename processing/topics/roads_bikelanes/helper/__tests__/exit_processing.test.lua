describe('exit_processing', function()
  local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
  local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')

  describe('exits on normalized tags', function()
    it('exits when highway is missing', function()
      assert.is_true(EXIT.exit_processing({}))
    end)

    it('exits for area=yes', function()
      assert.is_true(EXIT.exit_processing({
        highway = 'residential',
        area = 'yes',
      }))
    end)

    it('exits for disallowed service', function()
      assert.is_true(EXIT.exit_processing({
        highway = 'service',
        service = 'driveway',
      }))
    end)

    it('exits for disallowed highway class', function()
      assert.is_true(EXIT.exit_processing({
        highway = 'proposed',
      }))
    end)

    it('exits for forbidden access without lifecycle text', function()
      assert.is_true(EXIT.exit_processing({
        highway = 'residential',
        access = 'no',
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

      assert.is_false(EXIT.exit_processing(tags))
    end)

    it('keeps access=no with construction in description', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        description = 'Weg gesperrt aufgrund einer Baustelle',
      }
      transform_lifecycle_tags(tags)

      assert.is_false(EXIT.exit_processing(tags))
    end)

    it('keeps access=no with blocked term in note', function()
      local tags = {
        highway = 'residential',
        access = 'no',
        note = 'Sperrung „bis auf Weiteres” an israelischen Botschaft',
      }
      transform_lifecycle_tags(tags)

      assert.is_false(EXIT.exit_processing(tags))
    end)
  end)
end)
