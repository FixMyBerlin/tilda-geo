describe('era_width', function()
  local era_width = require('topics.roads_bikelanes.bikelanes.era_check.era_width')

  describe('fehlende Grundlagen', function()
    it('prüft nicht, wenn Tabelle 5 keine Zeile für die Führungsform hat', function()
      local result = era_width(1.0, {})
      assert.are.same({ era_width_check = 'nicht_anwendbar' }, result)
    end)

    it('prüft nicht ohne Breite', function()
      local result = era_width(nil, { 'radfahrstreifen' })
      assert.are.same({ era_width_check = 'unbekannt' }, result)
    end)
  end)

  describe('markierte Anlagen (Markierung wird addiert)', function()
    it('erfüllt das Regelmaß des Radfahrstreifens ab 1,60 m Fahrbahnbreite', function()
      local result = era_width(1.60, { 'radfahrstreifen' })
      assert.are.same({
        era_width_check = 'regelmass',
        era_width_used = 1.85,
        era_width_regelmass = 1.85,
      }, result)
    end)

    it('unterschreitet das Regelmaß des Radfahrstreifens knapp darunter', function()
      local result = era_width(1.59, { 'radfahrstreifen' })
      assert.are.same({
        era_width_check = 'unterschritten',
        era_width_used = 1.84,
        era_width_regelmass = 1.85,
      }, result)
    end)

    it('erfüllt beim Schutzstreifen nur das Mindestmaß', function()
      local result = era_width(1.00, { 'schutzstreifen' })
      assert.are.same({
        era_width_check = 'mindestmass',
        era_width_used = 1.25,
        era_width_regelmass = 1.50,
      }, result)
    end)

    it('erfüllt das Regelmaß des Schutzstreifens ab 1,25 m Fahrbahnbreite', function()
      local result = era_width(1.25, { 'schutzstreifen' })
      assert.are.same({
        era_width_check = 'regelmass',
        era_width_used = 1.50,
        era_width_regelmass = 1.50,
      }, result)
    end)

    it('unterschreitet auch das Mindestmaß des Schutzstreifens', function()
      local result = era_width(0.99, { 'schutzstreifen' })
      assert.are.same({
        era_width_check = 'unterschritten',
        era_width_used = 1.24,
        era_width_regelmass = 1.50,
      }, result)
    end)
  end)

  describe('bauliche Anlagen (keine Markierung)', function()
    it('erfüllt das Regelmaß des Einrichtungsradwegs ab 2,00 m', function()
      local result = era_width(2.00, { 'einrichtungsradweg' })
      assert.are.same({
        era_width_check = 'regelmass',
        era_width_used = 2.00,
        era_width_regelmass = 2.00,
      }, result)
    end)

    it('erfüllt beim Einrichtungsradweg nur den Klammerwert', function()
      local result = era_width(1.60, { 'einrichtungsradweg' })
      assert.are.same({
        era_width_check = 'klammerwert',
        era_width_used = 1.60,
        era_width_regelmass = 2.00,
      }, result)
    end)

    it('misst den einseitigen Zweirichtungsradweg an 3,00 m', function()
      local result = era_width(2.60, { 'zweirichtungsradweg_einseitig' })
      assert.are.same({
        era_width_check = 'klammerwert',
        era_width_used = 2.60,
        era_width_regelmass = 3.00,
      }, result)
    end)

    it('misst den gemeinsamen Geh- und Radweg an 2,50 m', function()
      local result = era_width(2.50, { 'gemeinsamer_geh_und_radweg' })
      assert.are.same({
        era_width_check = 'regelmass',
        era_width_used = 2.50,
        era_width_regelmass = 2.50,
      }, result)
    end)

    it('kennt für den gemeinsamen Geh- und Radweg keinen Wert unterhalb des Regelmaßes', function()
      local result = era_width(2.49, { 'gemeinsamer_geh_und_radweg' })
      assert.are.same({
        era_width_check = 'unterschritten',
        era_width_used = 2.49,
        era_width_regelmass = 2.50,
      }, result)
    end)
  end)

  describe('mehrere mögliche Anlagentypen', function()
    it('urteilt, wenn alle Kandidaten dasselbe ergeben, und weist das strengste erfüllte Regelmaß aus', function()
      local result = era_width(1.70, { 'schutzstreifen', 'radfahrstreifen' })
      assert.are.same({
        era_width_check = 'regelmass',
        era_width_used = 1.95,
        era_width_regelmass = 1.85,
      }, result)
    end)

    it('weist bei durchgängiger Unterschreitung das mildeste verfehlte Regelmaß aus', function()
      local result = era_width(0.90, { 'schutzstreifen', 'radfahrstreifen' })
      assert.are.same({
        era_width_check = 'unterschritten',
        era_width_used = 1.15,
        era_width_regelmass = 1.50,
      }, result)
    end)

    it('urteilt nicht, wenn die Kandidaten auseinanderfallen', function()
      local result = era_width(1.30, { 'schutzstreifen', 'radfahrstreifen' })
      assert.are.same({ era_width_check = 'unbekannt', era_width_used = 1.55 }, result)
    end)

    it('urteilt bei offener Verkehrsrichtung, wenn die Breite für jede Variante reicht', function()
      local result = era_width(3.00, {
        'einrichtungsradweg',
        'zweirichtungsradweg_beidseitig',
        'zweirichtungsradweg_einseitig',
      })
      assert.are.same({
        era_width_check = 'regelmass',
        era_width_used = 3.00,
        era_width_regelmass = 3.00,
      }, result)
    end)

    it('urteilt bei offener Verkehrsrichtung nicht, wenn nur ein Teil der Varianten passt', function()
      local result = era_width(2.20, {
        'einrichtungsradweg',
        'zweirichtungsradweg_beidseitig',
        'zweirichtungsradweg_einseitig',
      })
      assert.are.same({ era_width_check = 'unbekannt', era_width_used = 2.20 }, result)
    end)
  end)
end)
