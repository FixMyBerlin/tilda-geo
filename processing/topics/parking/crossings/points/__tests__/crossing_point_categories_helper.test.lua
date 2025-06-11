
describe('crossing_point_categories_helper', function()
  require('init')
  require('Log')
  local helper = require('crossing_point_categories_helper')

  describe('has_side_value', function()
    it('has_side_value returns true for left, right, both', function()
      assert.is_true(helper.has_side_value('left'))
      assert.is_true(helper.has_side_value('right'))
      assert.is_true(helper.has_side_value('both'))
    end)

    it('has_side_value returns false for other values', function()
      assert.is_false(helper.has_side_value('foo'))
      assert.is_false(helper.has_side_value(nil))
      assert.is_false(helper.has_side_value(123))
    end)
  end)


  describe('remove_side_suffix', function()
    it('remove_side_suffix removes :left, :right, :both', function()
      assert.are.equal(helper.remove_side_suffix('foo:left'), 'foo')
      assert.are.equal(helper.remove_side_suffix('bar:right'), 'bar')
      assert.are.equal(helper.remove_side_suffix('baz:both'), 'baz')
    end)

    it('remove_side_suffix returns input unchanged if not a string or no suffix', function()
      assert.are.equal(helper.remove_side_suffix(123), 123)
      assert.are.equal(helper.remove_side_suffix('foo'), 'foo')
    end)
  end)
end)
