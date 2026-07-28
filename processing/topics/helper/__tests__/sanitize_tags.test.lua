local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

describe('sanitize_tags', function()
  describe('safe_string', function()
    it('keeps apostrophes and quotes', function()
      local input = [[L'Etoile "Nord"]]
      assert.are.equal(SANITIZE_TAGS.safe_string(input), input)
    end)
  end)

  describe('access', function()
    it('allows destination', function()
      assert.are.equal(SANITIZE_TAGS.access('destination'), 'destination')
    end)

    it('maps construction to private', function()
      assert.are.equal(SANITIZE_TAGS.access('construction'), 'private')
    end)
  end)

  describe('informal', function()
    it('drops unknown', function()
      assert.is_nil(SANITIZE_TAGS.informal('unknown'))
    end)
    it('keeps yes', function()
      assert.are.equal(SANITIZE_TAGS.informal('yes'), 'yes')
    end)
  end)
end)
