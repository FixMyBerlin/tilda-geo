describe('era_check', function()
  local era_check = require('topics.roads_bikelanes.bikelanes.era_check.era_check')

  it('schreibt keine Tags für Führungsformen ohne Vorgabe in Tabelle 5', function()
    local result = era_check({ category_id = 'bicycleRoad', width = 4.5, oneway = 'no' })
    assert.are.same({}, result)
  end)

  it('nennt den Anlagentyp und das Ergebnis für einen Radfahrstreifen', function()
    local result = era_check({ category_id = 'cyclewayOnHighway_exclusive', width = 1.6, oneway = 'yes' })
    assert.are.same({
      era_anlagentyp = 'radfahrstreifen',
      era_width_check = 'regelmass',
      era_width_confidence = 'high',
      era_width_used = 1.85,
      era_width_regelmass = 1.85,
    }, result)
  end)

  it('meldet `unbekannt`, solange keine Breite erfasst ist', function()
    local result = era_check({ category_id = 'cyclewayOnHighway_advisory', oneway = 'yes' })
    assert.are.same({
      era_anlagentyp = 'schutzstreifen',
      era_width_check = 'unbekannt',
    }, result)
  end)

  it('nennt alle geprüften Anlagentypen und urteilt trotzdem', function()
    local result = era_check({
      category_id = 'cyclewayOnHighway_advisoryOrExclusive',
      width = 1.7,
      oneway = 'yes',
    })
    assert.are.same({
      era_anlagentyp = 'schutzstreifen;radfahrstreifen',
      era_width_check = 'regelmass',
      era_width_confidence = 'high',
      era_width_used = 1.95,
      era_width_regelmass = 1.85,
    }, result)
  end)

  it('folgt der angenommenen Verkehrsrichtung und weist das Ergebnis als angenommen aus', function()
    local result = era_check({
      category_id = 'cycleway_adjoining',
      width = 2.2,
      oneway = 'assumed_no',
      has_opposite_side_infrastructure = true,
    })
    assert.are.same({
      era_anlagentyp = 'zweirichtungsradweg_beidseitig',
      era_width_check = 'klammerwert',
      era_width_confidence = 'low',
      era_width_used = 2.2,
      era_width_regelmass = 2.50,
    }, result)
  end)

  it('misst den Radweg eines getrennten Geh- und Radwegs, wenn die Breite ihm gehört', function()
    local result = era_check({
      category_id = 'footAndCyclewaySegregated_adjoining',
      width = 1.2,
      oneway = 'yes',
      traffic_mode_right = 'foot',
    })
    assert.are.same({
      era_anlagentyp = 'einrichtungsradweg',
      era_width_check = 'unterschritten',
      era_width_confidence = 'high',
      era_width_used = 1.2,
      era_width_regelmass = 2.00,
    }, result)
  end)

  it('unterscheidet den einseitigen vom beidseitigen Zweirichtungsradweg', function()
    local einseitig = era_check({
      category_id = 'cycleway_adjoining',
      width = 2.6,
      oneway = 'no',
      has_opposite_side_infrastructure = false,
    })
    assert.are.same({
      era_anlagentyp = 'zweirichtungsradweg_einseitig',
      era_width_check = 'klammerwert',
      era_width_confidence = 'high',
      era_width_used = 2.6,
      era_width_regelmass = 3.00,
    }, einseitig)

    local beidseitig = era_check({
      category_id = 'cycleway_adjoining',
      width = 2.6,
      oneway = 'no',
      has_opposite_side_infrastructure = true,
    })
    assert.are.same({
      era_anlagentyp = 'zweirichtungsradweg_beidseitig',
      era_width_check = 'regelmass',
      era_width_confidence = 'high',
      era_width_used = 2.6,
      era_width_regelmass = 2.50,
    }, beidseitig)
  end)
end)
