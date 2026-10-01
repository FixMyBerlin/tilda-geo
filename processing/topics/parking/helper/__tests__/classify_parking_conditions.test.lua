describe('classify_parking_conditions', function()
  local log = require('topics.helper.log')
  local classify_parking_conditions = require('topics.parking.helper.classify_parking_conditions')

  it('returns condition_category for paid parking', function()
    local tags = { fee = 'yes', zone = '' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'paid')
  end)

  it('creates mixed condition_category for fee yes with zone', function()
    local tags = { fee = 'yes', zone = 'residential' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'mixed')
  end)

  it('creates residents condition_category for private access with zone', function()
    local tags = { access = 'private', zone = 'residential' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'residents')
  end)

  it('creates free condition_category for fee no without restrictions', function()
    local tags = { fee = 'no', access = 'yes', zone = '' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'free')
  end)

  it('creates loading condition_category for loading_only restriction', function()
    local tags = { restriction = 'loading_only' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'loading')
  end)

  it('creates time_limited condition_category for maxstay', function()
    local tags = { maxstay = '2 hours' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'time_limited (2 hours)')
  end)

  it('creates no_parking condition_category for no_parking restriction', function()
    local tags = { restriction = 'no_parking' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'no_parking')
  end)

  it('creates no_stopping condition_category for no_stopping restriction', function()
    local tags = { restriction = 'no_stopping' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'no_stopping')
  end)

  it('creates disabled_private condition_category for access no and disabled private', function()
    local tags = { access = 'no', disabled = 'private' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'disabled_private')
  end)

  it('creates charging condition_category for charging_only restriction', function()
    local tags = { restriction = 'charging_only' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'charging')
  end)

  it('creates bus_lane condition_category when reason is bus_lane with no_parking', function()
    local tags = { restriction = 'no_parking', reason = 'bus_lane' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'bus_lane')
  end)

  it('creates maxweight condition_category for maxweight tag', function()
    local tags = { maxweight = '3.5' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'maxweight (3.5 t)')
  end)

  it('uses default_category when no conditions apply (no merge from parent highway fee, maxweight, hgv)', function()
    local result = classify_parking_conditions({}, 'assumed_free')
    assert.are.equal(result.condition_category, 'assumed_free')
    local result_private = classify_parking_conditions({}, 'assumed_private')
    assert.are.equal(result_private.condition_category, 'assumed_private')
  end)

  describe('details only hold processed data', function()
    it('maps known opening_hours comments to tokens', function()
      local result = classify_parking_conditions({ ['fee:conditional'] = 'yes @ ("large events")' }, 'assumed_free')
      assert.are.equal('paid (large_events)', result.condition_category)
      assert.is_nil(result.rejected_tags)
    end)

    it('replaces unknown comments and reports the tag', function()
      local value = 'yes @ ("<img src=x onerror=alert>")'
      local result = classify_parking_conditions({ ['fee:conditional'] = value }, 'assumed_free')
      assert.are.equal('paid (other_comment)', result.condition_category)
      assert.are.same({ ['fee:conditional'] = value }, result.rejected_tags)
    end)

    it('normalizes maxstay durations', function()
      assert.are.equal('time_limited (30 minutes)', classify_parking_conditions({ maxstay = '30 min' }, 'assumed_free').condition_category)
      assert.are.equal('time_limited (1 hour)', classify_parking_conditions({ maxstay = '1 h' }, 'assumed_free').condition_category)
      assert.are.equal('time_limited (2 hours)', classify_parking_conditions({ maxstay = '2 hours' }, 'assumed_free').condition_category)
    end)

    it('drops unknown maxstay values but keeps the time limit, and reports the tag', function()
      local result = classify_parking_conditions({ maxstay = 'left' }, 'assumed_free')
      assert.are.equal('time_limited', result.condition_category)
      assert.are.same({ maxstay = 'left' }, result.rejected_tags)
    end)

    it('keeps the interval of a conditional maxstay with an unknown value', function()
      local result = classify_parking_conditions({ ['maxstay:conditional'] = 'kurz @ (Mo-Fr 08:00-18:00)' }, 'assumed_free')
      assert.are.equal('time_limited (Mo-Fr 08:00-18:00)', result.condition_category)
      assert.are.same({ ['maxstay:conditional'] = 'kurz @ (Mo-Fr 08:00-18:00)' }, result.rejected_tags)
    end)

    it('ignores access=unknown and reports it', function()
      local result = classify_parking_conditions({ fee = 'yes', access = 'unknown' }, 'assumed_free')
      assert.are.equal('paid', result.condition_category)
      assert.are.same({ access = 'unknown' }, result.rejected_tags)
    end)

    it('keeps access_restriction without detail for unknown access values', function()
      local result = classify_parking_conditions({ access = 'restricted' }, 'assumed_free')
      assert.are.equal('access_restriction', result.condition_category)
      assert.are.same({ access = 'restricted' }, result.rejected_tags)
    end)

    it('keeps known access values as detail', function()
      local result = classify_parking_conditions({ access = 'customers' }, 'assumed_free')
      assert.are.equal('access_restriction (customers)', result.condition_category)
      assert.is_nil(result.rejected_tags)
    end)
  end)

  it('keeps comparison operators in condition details', function()
    local tags = { ['restriction:conditional'] = 'loading_only @ (maxweightrating > 7.5)' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal('loading (maxweightrating > 7.5)', result.condition_category)
  end)

  it('writes the weightrating typo as maxweightrating', function()
    local tags = { ['restriction:conditional'] = 'no_stopping @ (weightrating > 7.5)' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal('no_stopping (maxweightrating > 7.5)', result.condition_category)
  end)

  it('handles conditional time in restriction', function()
    local tags = { ['restriction:conditional'] = 'loading_only @ (Mo-Sa 11:00-21:00)' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'loading (Mo-Sa 11:00-21:00)')
  end)

  it('combines multiple condition classes and applies subtract/sort pipeline', function()
    local tags = {
      restriction = 'no_parking',
      ['restriction:conditional'] = 'no_parking @ (Mo-Fr 08:00-18:00); loading_only @ (Mo-Fr 12:00-14:00)',
    }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'no_parking (Mo-Fr 08:00-18:00);loading (Mo-Fr 12:00-14:00)')
  end)

  it('does not add redundant no_parking when residential zone already classifies as residents (none @ residents)', function()
    local tags = {
      zone = 'residential',
      access = 'yes',
      ['restriction:conditional'] = 'no_parking @ (Mo-Fr 08:00-18:00); none @ residents',
    }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'residents (Mo-Fr 08:00-18:00)')
    assert.is_nil(string.match(result.condition_category, ';no_parking'))
  end)

  it('vehicle_excluded uses except prefix in vehicle_restriction detail (not no)', function()
    local tags = { hgv = 'no' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'assumed_free;vehicle_restriction (except hgv)')
    assert.is_nil(string.match(result.condition_category, 'vehicle_restriction %(no '))
  end)

  it('reads maxstay with @ (missing :conditional) like maxstay:conditional', function()
    local tags = { maxstay = '1 hour @ (Mo-Fr 08:00-18:00, Sa 08:00-14:00)' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal(result.condition_category, 'time_limited (1 hour) (Mo-Fr 08:00-18:00, Sa 08:00-14:00)')
  end)
  it('sets condition_category=invalid and reports malformed conditional values (strict)', function()
    local tags = {
      fee = 'yes',
      ['restriction:conditional'] = 'no_stopping @ (Mo-Sa 07:00-19:00; PH off)...)',
    }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal('invalid', result.condition_category)
    assert.are.same({ ['restriction:conditional'] = tags['restriction:conditional'] }, result.rejected_tags)
  end)

  it('reports malformed vehicle conditionals and malformed maxstay with @', function()
    local tags = {
      ['disabled:conditional'] = 'designated @ (@ (Mo-Fr 07:00-19:00)',
      maxstay = '1 hour @ ((Mo-Fr 08:00-18:00))',
    }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.are.equal('invalid', result.condition_category)
    assert.are.same({
      ['disabled:conditional'] = tags['disabled:conditional'],
      maxstay = tags.maxstay,
    }, result.rejected_tags)
  end)

  it('keeps the maxstay:conditional=yes flag valid', function()
    local tags = { ['maxstay:conditional'] = 'yes' }
    local result = classify_parking_conditions(tags, 'assumed_free')
    assert.is_nil(result.rejected_tags)
  end)
end)
