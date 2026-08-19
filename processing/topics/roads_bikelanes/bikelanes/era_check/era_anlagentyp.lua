local SET = require('topics.helper.sets')

-- Zuordnung `bikelanes.category` -> Zeile(n) der ERA-Tabelle 5.
-- Kategorien, die hier fehlen, kennt Tabelle 5 nicht; für sie gibt es kein Breiten-Regelmaß.
-- Mehrere Einträge heißen: der Anlagentyp ist aus den Daten nicht eindeutig, es wird gegen alle
-- in Frage kommenden Zeilen geprüft (siehe `era_width.lua`).
---@type table<string, EraAnlagentyp[]>
local CATEGORY_MAP = {
  cyclewayOnHighway_advisory = { 'schutzstreifen' },
  cyclewayOnHighway_exclusive = { 'radfahrstreifen' },
  cyclewayOnHighway_advisoryOrExclusive = { 'schutzstreifen', 'radfahrstreifen' },
  -- Fahrradweiche: ERA kennt sie nicht als eigenen Anlagentyp, sie ist ein Radfahrstreifen in Mittellage.
  cyclewayOnHighwayBetweenLanes = { 'radfahrstreifen' },
  -- ANNAHME: ERA 2010 kennt den geschützten Radfahrstreifen noch nicht. Wir messen ihn am
  -- Radfahrstreifen, also an der Untergrenze dessen, was für ihn gelten kann.
  cyclewayOnHighwayProtected = { 'radfahrstreifen' },
  footAndCyclewayShared_adjoining = { 'gemeinsamer_geh_und_radweg' },
  footAndCyclewayShared_isolated = { 'gemeinsamer_geh_und_radweg' },
  footAndCyclewayShared_adjoiningOrIsolated = { 'gemeinsamer_geh_und_radweg' },
}

-- Bauliche Radwege. Ihr Anlagentyp hängt zusätzlich an der Verkehrsrichtung, siehe unten.
-- (Die Kategorie-Ids stammen aus `cyclewaySeparated` mit `id = 'cycleway'`.)
local RADWEG_CATEGORIES = SET.set({
  'cycleway_adjoining',
  'cycleway_isolated',
  'cycleway_adjoiningOrIsolated',
})

-- Getrennte Geh- und Radwege. Tabelle 5 hat für sie keine eigene Zeile; der Radwegteil folgt den
-- Radweg-Zeilen. Ob wir ihn messen können, hängt daran, worauf sich `width` bezieht, siehe unten.
local SEGREGATED_CATEGORIES = SET.set({
  'footAndCyclewaySegregated_adjoining',
  'footAndCyclewaySegregated_isolated',
  'footAndCyclewaySegregated_adjoiningOrIsolated',
})

-- Bewusst ohne ERA-Zeile (Ergebnis: keine Breitenprüfung):
-- * `footwayBicycleYes_*` – ein Gehweg ist keine Radverkehrsanlage im Sinne der Tabelle 5.
-- * `bicycleRoad*`, `sharedMotorVehicleLane`, `sharedBusLane*`, `pedestrianAreaBicycleYes`,
--   `livingStreet` – Führung im Mischverkehr, kein Breitenmaß in Tabelle 5.
-- * `crossing`, `cyclewayLink`, `needsClarification` – keine Strecken-Führungsform.

---@param has_opposite_side_infrastructure boolean|nil
---@return EraAnlagentyp[]
local function zweirichtungsradweg_candidates(has_opposite_side_infrastructure)
  if has_opposite_side_infrastructure == nil then
    -- Eigenständige Geometrie: ob die Straße auf der Gegenseite ebenfalls einen Radweg hat, wissen
    -- wir hier nicht.
    return { 'zweirichtungsradweg_beidseitig', 'zweirichtungsradweg_einseitig' }
  end
  if has_opposite_side_infrastructure then
    return { 'zweirichtungsradweg_beidseitig' }
  end
  return { 'zweirichtungsradweg_einseitig' }
end

--- Verkehrsrichtungen, die `derive_oneway` nicht aus einem OSM-Tag liest, sondern annimmt. Wir
--- folgen der Annahme (sonst bliebe ein Großteil der Radwege unbewertet), kennzeichnen das Ergebnis
--- aber als angenommen.
local ASSUMED_ONEWAY = SET.set({ 'implicit_yes', 'assumed_no' })

--- Lage aus dem Pseudo-Tag `_in_settlement_area` (siehe `../../pseudo_tags_settlement_area/`).
--- Der Wert ist selbst eine Schätzung – daher `assumed_*` –, deshalb ist jedes Urteil, das auf ihm
--- ruht, ein angenommenes.
---@type table<string, EraLage>
local LAGE_BY_SETTLEMENT_VALUE = {
  assumed_yes = 'innerorts',
  assumed_no = 'ausserorts',
}

---@param oneway string|nil Ergebnis von `derive_oneway`
---@param has_opposite_side_infrastructure boolean|nil
---@param lage EraLage|nil
---@return EraAnlagentyp[], boolean, EraLage|nil candidates, ob die Verkehrsrichtung nur angenommen ist, Lage falls sie die Auswahl bestimmt hat
local function radweg_candidates(oneway, has_opposite_side_infrastructure, lage)
  local assumed = ASSUMED_ONEWAY[oneway] == true

  if oneway == 'yes' or oneway == 'implicit_yes' then
    return { 'einrichtungsradweg' }, assumed, nil
  end
  if oneway == 'no' or oneway == 'car_not_bike' then
    return zweirichtungsradweg_candidates(has_opposite_side_infrastructure), assumed, nil
  end

  -- `assumed_no` ist der Fallback von `derive_oneway`: zur Richtung steht nichts in OSM. Hier – und
  -- nur hier – hilft die Lage weiter, denn die ERA misst Ein- und Zweirichtungsradwege verschieden:
  -- innerorts ist der Einrichtungsradweg die Regel, außerorts der Zweirichtungsradweg (der Radweg
  -- führt dort meist beide Richtungen). Ohne bekannte Lage bleibt es beim bisherigen Verhalten.
  if oneway == 'assumed_no' then
    if lage == 'innerorts' then
      return { 'einrichtungsradweg' }, true, lage
    end
    if lage == 'ausserorts' then
      return zweirichtungsradweg_candidates(has_opposite_side_infrastructure), true, lage
    end
    return zweirichtungsradweg_candidates(has_opposite_side_infrastructure), true, nil
  end

  -- Ohne jedes Ergebnis von `derive_oneway` ist die Richtung völlig offen.
  local candidates = { 'einrichtungsradweg' }
  for _, anlagentyp in ipairs(zweirichtungsradweg_candidates(has_opposite_side_infrastructure)) do
    table.insert(candidates, anlagentyp)
  end
  return candidates, true, nil
end

---@class EraAnlagentypArgs
---@field category_id string
---@field oneway string|nil Ergebnis von `derive_oneway`
---@field has_opposite_side_infrastructure boolean|nil `nil` = unbekannt (eigenständige Geometrie)
---@field prefix string|nil Tag-Familie, aus der die Werte stammen ('cycleway'|'sidewalk'|nil)
---@field traffic_mode_right string|nil Was rechts neben der Anlage liegt
---@field in_settlement_area string|nil Pseudo-Tag `_in_settlement_area` ('assumed_yes'|'assumed_no'), `nil` = unbekannt

--- Beim getrennten Geh- und Radweg beschreibt `width` mal den Radweg allein, mal Geh- und Radweg
--- zusammen. Dem Radweg gehört sie, wenn sie aus `cycleway:<seite>:width` stammt, oder wenn über
--- `traffic_mode:right` erfasst ist, was neben dem Weg liegt – dann ist der Gehweg eine eigene
--- Geometrie und die Breite beschreibt nur diesen Radweg.
---@param args EraAnlagentypArgs
---@return boolean
local function segregated_width_belongs_to_cycleway(args)
  return args.prefix == 'cycleway' or args.traffic_mode_right ~= nil
end

--- Ermittelt die in Frage kommenden Zeilen der ERA-Tabelle 5.
---@param args EraAnlagentypArgs
---@return EraAnlagentyp[], boolean, EraLage|nil Leere Liste = Tabelle 5 kennt für diese Kategorie kein Breitenmaß; boolean = auf angenommenen Werten beruhend; Lage nur, wenn sie die Auswahl bestimmt hat
local function era_anlagentyp(args)
  local lage = args.in_settlement_area and LAGE_BY_SETTLEMENT_VALUE[args.in_settlement_area] or nil

  if RADWEG_CATEGORIES[args.category_id] then
    return radweg_candidates(args.oneway, args.has_opposite_side_infrastructure, lage)
  end
  if SEGREGATED_CATEGORIES[args.category_id] then
    if not segregated_width_belongs_to_cycleway(args) then
      return {}, false, nil
    end
    return radweg_candidates(args.oneway, args.has_opposite_side_infrastructure, lage)
  end
  -- Bei allen übrigen Führungsformen hängt der Anlagentyp weder an der Verkehrsrichtung noch an der
  -- Lage. Auch der gemeinsame Geh- und Radweg nicht: Tabelle 5 führt ihn zwar getrennt nach
  -- innerorts und außerorts, nennt aber beide Male 2,50 m (siehe `era_width_requirements.lua`).
  return CATEGORY_MAP[args.category_id] or {}, false, nil
end

return era_anlagentyp
