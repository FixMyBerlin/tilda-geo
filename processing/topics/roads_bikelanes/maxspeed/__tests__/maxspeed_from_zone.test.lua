describe('maxspeed_from_zone', function()
  local maxspeed_from_zone = require('topics.roads_bikelanes.maxspeed.maxspeed_from_zone')

  local function assert_zone(expected_maxspeed, tags)
    local maxspeed, source, confidence = maxspeed_from_zone(tags)
    assert.are.equal(expected_maxspeed, maxspeed)
    assert.are.equal('zone', source)
    assert.are.equal('high', confidence)
  end

  local function assert_no_match(tags)
    local maxspeed, source, confidence = maxspeed_from_zone(tags)
    assert.is_nil(maxspeed)
    assert.is_nil(source)
    assert.is_nil(confidence)
  end

  describe('maxspeed:type', function()
    it('maps every known value', function()
      assert_zone(100, { ['maxspeed:type'] = 'DE:rural' })
      assert_zone(50, { ['maxspeed:type'] = 'DE:urban' })
      assert_zone(30, { ['maxspeed:type'] = 'DE:zone30' })
      assert_zone(30, { ['maxspeed:type'] = 'DE:bicycle_road' })
      assert_zone(20, { ['maxspeed:type'] = 'DE:zone20' })
      assert_zone(10, { ['maxspeed:type'] = 'DE:zone10' })
    end)

    it('ignores values of the other tags', function()
      assert_no_match({ ['maxspeed:type'] = 'DE:30' })
      assert_no_match({ ['maxspeed:type'] = 'DE:zone:30' })
      assert_no_match({ ['maxspeed:type'] = 'sign' })
    end)
  end)

  describe('zone:maxspeed', function()
    it('maps the country prefixed values', function()
      assert_zone(30, { ['zone:maxspeed'] = 'DE:30' })
      assert_zone(20, { ['zone:maxspeed'] = 'DE:20' })
      assert_zone(10, { ['zone:maxspeed'] = 'DE:10' })
      assert_zone(30, { ['zone:maxspeed'] = 'DE:bicycle_road' })
    end)

    it('maps the plain number values', function()
      assert_zone(30, { ['zone:maxspeed'] = '30' })
      assert_zone(20, { ['zone:maxspeed'] = '20' })
      assert_zone(10, { ['zone:maxspeed'] = '10' })
    end)

    it('ignores values of the other tags', function()
      assert_no_match({ ['zone:maxspeed'] = 'DE:zone30' })
      assert_no_match({ ['zone:maxspeed'] = 'DE:urban' })
      assert_no_match({ ['zone:maxspeed'] = 'no' })
    end)
  end)

  describe('source:maxspeed', function()
    it('maps the zone values with colon', function()
      assert_zone(30, { ['source:maxspeed'] = 'DE:zone:30' })
      assert_zone(20, { ['source:maxspeed'] = 'DE:zone:20' })
      assert_zone(10, { ['source:maxspeed'] = 'DE:zone:10' })
    end)

    it('maps the zone values without colon', function()
      assert_zone(30, { ['source:maxspeed'] = 'DE:zone30' })
      assert_zone(20, { ['source:maxspeed'] = 'DE:zone20' })
      assert_zone(10, { ['source:maxspeed'] = 'DE:zone10' })
    end)

    it('maps the other known values', function()
      assert_zone(100, { ['source:maxspeed'] = 'DE:rural' })
      assert_zone(50, { ['source:maxspeed'] = 'DE:urban' })
      assert_zone(30, { ['source:maxspeed'] = 'DE:bicycle_road' })
    end)

    it('ignores values of the other tags', function()
      assert_no_match({ ['source:maxspeed'] = 'DE:30' })
      assert_no_match({ ['source:maxspeed'] = '30' })
      assert_no_match({ ['source:maxspeed'] = 'sign' })
    end)
  end)

  describe('precedence', function()
    it('zone:maxspeed wins over maxspeed:type', function()
      assert_zone(20, { ['maxspeed:type'] = 'DE:zone30', ['zone:maxspeed'] = 'DE:20' })
    end)

    it('source:maxspeed wins over zone:maxspeed', function()
      assert_zone(10, { ['zone:maxspeed'] = 'DE:20', ['source:maxspeed'] = 'DE:zone:10' })
    end)

    it('source:maxspeed wins over both other tags', function()
      assert_zone(10, {
        ['maxspeed:type'] = 'DE:zone30',
        ['zone:maxspeed'] = 'DE:20',
        ['source:maxspeed'] = 'DE:zone:10',
      })
    end)

    it('an unknown value does not override a match of an earlier tag', function()
      assert_zone(30, { ['maxspeed:type'] = 'DE:zone30', ['zone:maxspeed'] = 'no', ['source:maxspeed'] = 'sign' })
      assert_zone(20, { ['zone:maxspeed'] = 'DE:20', ['source:maxspeed'] = 'sign' })
    end)
  end)

  it('returns nil without zone tags', function()
    assert_no_match({ highway = 'residential' })
  end)
end)
