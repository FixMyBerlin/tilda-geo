describe('era_anlagentyp', function()
  local era_anlagentyp = require('topics.roads_bikelanes.bikelanes.era_check.era_anlagentyp')

  describe('markierte Anlagen auf der Fahrbahn', function()
    it('ordnet den Schutzstreifen zu', function()
      local result = era_anlagentyp({ category_id = 'cyclewayOnHighway_advisory' })
      assert.are.same({ 'schutzstreifen' }, result)
    end)

    it('ordnet den Radfahrstreifen zu', function()
      local result = era_anlagentyp({ category_id = 'cyclewayOnHighway_exclusive' })
      assert.are.same({ 'radfahrstreifen' }, result)
    end)

    it('lässt bei unklarer Kategorisierung beide Anlagentypen offen', function()
      local result = era_anlagentyp({ category_id = 'cyclewayOnHighway_advisoryOrExclusive' })
      assert.are.same({ 'schutzstreifen', 'radfahrstreifen' }, result)
    end)

    it('misst die Fahrradweiche am Radfahrstreifen', function()
      local result = era_anlagentyp({ category_id = 'cyclewayOnHighwayBetweenLanes' })
      assert.are.same({ 'radfahrstreifen' }, result)
    end)

    it('misst den geschützten Radfahrstreifen am Radfahrstreifen', function()
      local result = era_anlagentyp({ category_id = 'cyclewayOnHighwayProtected' })
      assert.are.same({ 'radfahrstreifen' }, result)
    end)
  end)

  describe('bauliche Radwege', function()
    it('ist bei `oneway=yes` ein Einrichtungsradweg', function()
      local result, assumed = era_anlagentyp({ category_id = 'cycleway_adjoining', oneway = 'yes' })
      assert.are.same({ 'einrichtungsradweg' }, result)
      assert.is_false(assumed)
    end)

    it('ist bei abgeleiteter Einbahnführung ein angenommener Einrichtungsradweg', function()
      local result, assumed = era_anlagentyp({ category_id = 'cycleway_adjoining', oneway = 'implicit_yes' })
      assert.are.same({ 'einrichtungsradweg' }, result)
      assert.is_true(assumed)
    end)

    it('ist beidseitig, wenn die Gegenseite auch Radinfrastruktur hat', function()
      local result = era_anlagentyp({
        category_id = 'cycleway_adjoining',
        oneway = 'no',
        has_opposite_side_infrastructure = true,
      })
      assert.are.same({ 'zweirichtungsradweg_beidseitig' }, result)
    end)

    it('ist einseitig, wenn die Gegenseite keine Radinfrastruktur hat', function()
      local result = era_anlagentyp({
        category_id = 'cycleway_adjoining',
        oneway = 'car_not_bike',
        has_opposite_side_infrastructure = false,
      })
      assert.are.same({ 'zweirichtungsradweg_einseitig' }, result)
    end)

    it('lässt beide Zweirichtungsvarianten offen, wenn die Gegenseite unbekannt ist', function()
      local result = era_anlagentyp({ category_id = 'cycleway_isolated', oneway = 'no' })
      assert.are.same({ 'zweirichtungsradweg_beidseitig', 'zweirichtungsradweg_einseitig' }, result)
    end)

    it('folgt der geratenen Verkehrsrichtung (`assumed_no`), kennzeichnet sie aber als angenommen', function()
      local result, assumed = era_anlagentyp({
        category_id = 'cycleway_adjoiningOrIsolated',
        oneway = 'assumed_no',
        has_opposite_side_infrastructure = true,
      })
      assert.are.same({ 'zweirichtungsradweg_beidseitig' }, result)
      assert.is_true(assumed)
    end)

    it('nimmt innerorts einen Einrichtungsradweg an, wenn die Richtung nicht erfasst ist', function()
      local result, assumed, lage = era_anlagentyp({
        category_id = 'cycleway_adjoining',
        oneway = 'assumed_no',
        in_settlement_area = 'assumed_yes',
      })
      assert.are.same({ 'einrichtungsradweg' }, result)
      assert.is_true(assumed)
      assert.are.equal('innerorts', lage)
    end)

    it('nimmt außerorts einen Zweirichtungsradweg an, wenn die Richtung nicht erfasst ist', function()
      local result, assumed, lage = era_anlagentyp({
        category_id = 'cycleway_adjoining',
        oneway = 'assumed_no',
        has_opposite_side_infrastructure = false,
        in_settlement_area = 'assumed_no',
      })
      assert.are.same({ 'zweirichtungsradweg_einseitig' }, result)
      assert.is_true(assumed)
      assert.are.equal('ausserorts', lage)
    end)

    it('lässt die Lage unbeachtet, wenn die Richtung erfasst ist', function()
      local result, _assumed, lage = era_anlagentyp({
        category_id = 'cycleway_adjoining',
        oneway = 'no',
        has_opposite_side_infrastructure = true,
        in_settlement_area = 'assumed_yes',
      })
      assert.are.same({ 'zweirichtungsradweg_beidseitig' }, result)
      assert.is_nil(lage)
    end)

    it('lässt ohne `oneway` alles offen', function()
      local result, assumed = era_anlagentyp({ category_id = 'cycleway_adjoining' })
      assert.are.same({
        'einrichtungsradweg',
        'zweirichtungsradweg_beidseitig',
        'zweirichtungsradweg_einseitig',
      }, result)
      assert.is_true(assumed)
    end)
  end)

  describe('gemeinsamer Geh- und Radweg', function()
    it('ordnet alle Untervarianten derselben Zeile zu', function()
      for _, category_id in ipairs({
        'footAndCyclewayShared_adjoining',
        'footAndCyclewayShared_isolated',
        'footAndCyclewayShared_adjoiningOrIsolated',
      }) do
        assert.are.same({ 'gemeinsamer_geh_und_radweg' }, era_anlagentyp({ category_id = category_id }))
      end
    end)

    it('bleibt bei derselben Zeile, egal ob innerorts oder außerorts', function()
      for _, in_settlement_area in ipairs({ 'assumed_yes', 'assumed_no' }) do
        local result, _assumed, lage = era_anlagentyp({
          category_id = 'footAndCyclewayShared_adjoining',
          in_settlement_area = in_settlement_area,
        })
        assert.are.same({ 'gemeinsamer_geh_und_radweg' }, result)
        assert.is_nil(lage)
      end
    end)
  end)

  describe('getrennter Geh- und Radweg', function()
    it('misst den Radweg, wenn die Breite aus `cycleway:<seite>:width` stammt', function()
      local result = era_anlagentyp({
        category_id = 'footAndCyclewaySegregated_adjoining',
        oneway = 'yes',
        prefix = 'cycleway',
      })
      assert.are.same({ 'einrichtungsradweg' }, result)
    end)

    it('misst den Radweg, wenn `traffic_mode:right` sagt, was daneben liegt', function()
      local result = era_anlagentyp({
        category_id = 'footAndCyclewaySegregated_adjoining',
        oneway = 'yes',
        traffic_mode_right = 'foot',
      })
      assert.are.same({ 'einrichtungsradweg' }, result)
    end)

    it('prüft nicht, wenn die Breite Geh- und Radweg zusammen meint', function()
      local result = era_anlagentyp({
        category_id = 'footAndCyclewaySegregated_adjoining',
        oneway = 'yes',
      })
      assert.are.same({}, result)
    end)
  end)

  describe('Kategorien ohne Vorgabe in Tabelle 5', function()
    it('liefert keine Kandidaten', function()
      for _, category_id in ipairs({
        'footwayBicycleYes_adjoining',
        'bicycleRoad',
        'bicycleRoad_vehicleDestination',
        'sharedMotorVehicleLane',
        'sharedBusLaneBikeWithBus',
        'sharedBusLaneBusWithBike',
        'pedestrianAreaBicycleYes',
        'livingStreet',
        'crossing',
        'cyclewayLink',
        'needsClarification',
      }) do
        assert.are.same({}, era_anlagentyp({ category_id = category_id, oneway = 'yes' }))
      end
    end)
  end)
end)
