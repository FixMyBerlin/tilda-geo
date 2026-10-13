describe('derive_width', function()
  require('topics.helper.osm2pgsql')
  local derive_width = require('topics.helper.derive_width')

  describe('with width tag', function()
    it('returns high confidence and keeps source:width', function()
      local result = derive_width({
        width = '3.5 m',
        ['source:width'] = 'ARCore',
      })
      assert.are.same(result, {
        width = 3.5,
        width_source = 'ARCore',
        width_confidence = 'high',
      })
    end)

    it('prefers width over est_width', function()
      local result = derive_width({
        width = '4 m',
        est_width = '6 m',
      })
      assert.are.same(result, {
        width = 4,
        width_source = nil,
        width_confidence = 'high',
      })
    end)

    it('reads width:source when source:width is missing', function()
      local result = derive_width({
        width = '4',
        ['width:source'] = 'ALKIS',
      })
      assert.are.equal(result.width_source, 'ALKIS')
      assert.are.equal(result.width_confidence, 'high')
    end)
  end)

  describe('with an estimate', function()
    it('returns medium confidence for est_width and keeps source:width', function()
      local result = derive_width({
        est_width = '6m',
        ['source:width'] = 'Luftbild 2025',
      })
      assert.are.same(result, {
        width = 6,
        width_source = 'Luftbild 2025',
        width_confidence = 'medium',
      })
    end)

    it('falls back to est_width when width is unparsable', function()
      local result = derive_width({
        width = 'fehlerhafter Text',
        est_width = '5',
        ['source:width'] = 'ALKIS',
      })
      assert.are.same(result, {
        width = 5,
        width_source = 'ALKIS',
        width_confidence = 'medium',
      })
    end)

    it('returns medium confidence for a width whose source says estimated', function()
      for _, source in ipairs({ 'estimated', 'estimate', 'Estimated from Imagery', 'geschätzt nach Besichtigung', 'Schätzung', 'rough guess', 'approx' }) do
        local result = derive_width({ width = '3', ['source:width'] = source })
        assert.are.equal(result.width_confidence, 'medium', source)
        assert.are.equal(result.width_source, source)
      end
    end)
  end)

  describe('with no usable width', function()
    it('returns nils when both tags are missing', function()
      local result = derive_width({})
      assert.are.same(result, {
        width = nil,
        width_source = nil,
        width_confidence = nil,
      })
    end)

    it('returns nils when both tags are unparsable', function()
      local result = derive_width({
        width = 'invalid_width',
        est_width = 'invalid_est_width',
        ['source:width'] = 'ALKIS',
      })
      assert.are.same(result, {
        width = nil,
        width_source = nil,
        width_confidence = nil,
      })
    end)
  end)
end)
