describe('sanitize_condition_tags', function()
  local SANITIZE = require('topics.parking.helper.sanitize_condition_tags')

  it('returns clean tags unchanged and reports nothing', function()
    local tags = { fee = 'yes', maxstay = '2 hours', ['restriction:conditional'] = 'no_parking @ (Mo-Fr 08:00-18:00); none @ residents' }
    local result = SANITIZE.sanitize(tags)
    assert.are.same(tags, result.tags)
    assert.is_nil(result.dropped_tags)
    assert.is_nil(result.rewritten_tags)
    assert.is_nil(result.invalid)
  end)

  it('marks malformed conditionals as invalid and drops them', function()
    local value = 'no_stopping @ (Mo-Sa 07:00-19:00; PH off)...)'
    local result = SANITIZE.sanitize({ ['restriction:conditional'] = value })
    assert.is_true(result.invalid)
    assert.are.same({ ['restriction:conditional'] = value }, result.dropped_tags)
  end)

  it('rewrites clear mistakes in conditions (rewritten)', function()
    local result = SANITIZE.sanitize({ ['restriction:conditional'] = 'no_stopping @ (Mo-FR 7:00-9:00); loading_only @ (weightrating>7.5)' })
    assert.are.equal('no_stopping @ (Mo-Fr 07:00-09:00); loading_only @ (maxweightrating > 7.5)', result.tags['restriction:conditional'])
    assert.are.same({ ['restriction:conditional'] = 'no_stopping @ (Mo-FR 7:00-9:00); loading_only @ (weightrating>7.5)' }, result.rewritten_tags)
    assert.is_nil(result.dropped_tags)
  end)

  it('replaces atoms it does not understand (dropped, also when something was rewritten)', function()
    local value = 'no_parking @ (Mo-FR 076:00-09:00)'
    local result = SANITIZE.sanitize({ ['restriction:conditional'] = value })
    assert.are.equal('no_parking @ (Mo-Fr other_condition)', result.tags['restriction:conditional'])
    assert.are.same({ ['restriction:conditional'] = value }, result.dropped_tags)
    assert.is_nil(result.rewritten_tags)
  end)

  it('maps comments to tokens; only unknown ones are reported', function()
    local known = SANITIZE.sanitize({ ['fee:conditional'] = 'yes @ ("large events")' })
    assert.are.equal('yes @ (large_events)', known.tags['fee:conditional'])
    assert.is_nil(known.dropped_tags)

    local unknown = SANITIZE.sanitize({ ['fee:conditional'] = 'yes @ ("Kirmes")' })
    assert.are.equal('yes @ (other_comment)', unknown.tags['fee:conditional'])
    assert.are.same({ ['fee:conditional'] = 'yes @ ("Kirmes")' }, unknown.dropped_tags)
  end)

  it('cleans maxstay', function()
    assert.are.equal('30 minutes', SANITIZE.sanitize({ maxstay = '30 min' }).tags.maxstay)
    assert.is_nil(SANITIZE.sanitize({ maxstay = '30 min' }).rewritten_tags)

    local bare = SANITIZE.sanitize({ maxstay = '120' })
    assert.are.equal('120 minutes', bare.tags.maxstay)
    assert.are.same({ maxstay = '120' }, bare.rewritten_tags)

    local unknown = SANITIZE.sanitize({ maxstay = 'left' })
    assert.are.equal('yes', unknown.tags.maxstay)
    assert.are.same({ maxstay = 'left' }, unknown.dropped_tags)

    local conditional = SANITIZE.sanitize({ ['maxstay:conditional'] = '2h @ (Mo-Fr 08:00-18:00)' })
    assert.are.equal('2 hours @ (Mo-Fr 08:00-18:00)', conditional.tags['maxstay:conditional'])

    local misplaced = SANITIZE.sanitize({ maxstay = '1 hour @ (Mo-Fr 08:00-18:00)' })
    assert.are.equal('1 hour @ (Mo-Fr 08:00-18:00)', misplaced.tags.maxstay)
    assert.is_nil(misplaced.dropped_tags)
  end)

  it('cleans access', function()
    local unknown = SANITIZE.sanitize({ access = 'unknown' })
    assert.is_nil(unknown.tags.access)
    assert.are.same({ access = 'unknown' }, unknown.dropped_tags)

    local other = SANITIZE.sanitize({ motor_vehicle = 'restricted', access = 'yes' })
    assert.are.equal(SANITIZE.ACCESS_OTHER, other.tags.motor_vehicle)
    assert.are.same({ motor_vehicle = 'restricted' }, other.dropped_tags)

    local known = SANITIZE.sanitize({ access = 'customers' })
    assert.are.equal('customers', known.tags.access)
    assert.is_nil(known.dropped_tags)
  end)
end)
