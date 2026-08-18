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

---@param oneway string|nil Ergebnis von `derive_oneway`
---@param has_opposite_side_infrastructure boolean|nil
---@return EraAnlagentyp[], boolean candidates, ob die Verkehrsrichtung nur angenommen ist
local function radweg_candidates(oneway, has_opposite_side_infrastructure)
  local assumed = ASSUMED_ONEWAY[oneway] == true

  if oneway == 'yes' or oneway == 'implicit_yes' then
    return { 'einrichtungsradweg' }, assumed
  end
  if oneway == 'no' or oneway == 'car_not_bike' or oneway == 'assumed_no' then
    return zweirichtungsradweg_candidates(has_opposite_side_infrastructure), assumed
  end

  -- Ohne jedes Ergebnis von `derive_oneway` ist die Richtung völlig offen.
  local candidates = { 'einrichtungsradweg' }
  for _, anlagentyp in ipairs(zweirichtungsradweg_candidates(has_opposite_side_infrastructure)) do
    table.insert(candidates, anlagentyp)
  end
  return candidates, true
end

---@class EraAnlagentypArgs
---@field category_id string
---@field oneway string|nil Ergebnis von `derive_oneway`
---@field has_opposite_side_infrastructure boolean|nil `nil` = unbekannt (eigenständige Geometrie)
---@field prefix string|nil Tag-Familie, aus der die Werte stammen ('cycleway'|'sidewalk'|nil)
---@field traffic_mode_right string|nil Was rechts neben der Anlage liegt

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
---@return EraAnlagentyp[], boolean Leere Liste = Tabelle 5 kennt für diese Kategorie kein Breitenmaß; boolean = auf angenommenen Werten beruhend
local function era_anlagentyp(args)
  if RADWEG_CATEGORIES[args.category_id] then
    return radweg_candidates(args.oneway, args.has_opposite_side_infrastructure)
  end
  if SEGREGATED_CATEGORIES[args.category_id] then
    if not segregated_width_belongs_to_cycleway(args) then
      return {}, false
    end
    return radweg_candidates(args.oneway, args.has_opposite_side_infrastructure)
  end
  -- Bei allen übrigen Führungsformen hängt der Anlagentyp nicht an der Verkehrsrichtung.
  return CATEGORY_MAP[args.category_id] or {}, false
end

return era_anlagentyp
