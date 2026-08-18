-- FGSV ERA 2010, Tabelle 5 "Breitenmaße von Radverkehrsanlagen und Sicherheitstrennstreifen".
-- Diese Datei ist die einzige Stelle, an der die Maße der Tabelle stehen; die Prüflogik liest sie nur.
-- Die Sicherheitstrennstreifen-Spalten der Tabelle sind noch nicht abgebildet, sie brauchen die
-- Betrachtung des ruhenden Verkehrs (Phase 2 des ERA-Checks).

---@alias EraAnlagentyp 'schutzstreifen'|'radfahrstreifen'|'einrichtungsradweg'|'zweirichtungsradweg_beidseitig'|'zweirichtungsradweg_einseitig'|'gemeinsamer_geh_und_radweg'

---@class EraWidthRequirement
---@field regelmass number Regelmaß in Metern. Nach FGSV E-Klima zugleich der einzuhaltende Mindestwert.
---@field mindestmass number|nil Echtes Mindestmaß der ERA (nur Schutzstreifen).
---@field klammerwert number|nil ERA-Klammerwert "bei geringer Radverkehrsstärke"; nach E-Klima nicht mehr anzuwenden.
---@field markiert boolean Anlage ist durch eine Markierung von der Fahrbahn getrennt (steuert die Markierungsaddition in `era_width.lua`).

-- Regelbreite der Markierung von Schutz- und Radfahrstreifen. Die Breiten der Tabelle 5 gelten
-- "jeweils einschließlich Markierung", das OSM-Tag `width` wird bei uns ohne Markierung angenommen.
local ERA_MARKING_WIDTH = 0.25

---@type table<EraAnlagentyp, EraWidthRequirement>
local requirements = {
  schutzstreifen = { regelmass = 1.50, mindestmass = 1.25, klammerwert = nil, markiert = true },
  radfahrstreifen = { regelmass = 1.85, mindestmass = nil, klammerwert = nil, markiert = true },
  einrichtungsradweg = { regelmass = 2.00, mindestmass = nil, klammerwert = 1.60, markiert = false },
  zweirichtungsradweg_beidseitig = { regelmass = 2.50, mindestmass = nil, klammerwert = 2.00, markiert = false },
  zweirichtungsradweg_einseitig = { regelmass = 3.00, mindestmass = nil, klammerwert = 2.50, markiert = false },
  -- Tabelle 5 führt den gemeinsamen Geh- und Radweg zweimal: innerorts ">= 2,50 m" (abhängig von
  -- Fußgänger- und Radverkehrsstärke) und außerorts 2,50 m. Für die Breite ist die Unterscheidung
  -- ohne Wirkung, deshalb eine Zeile. Innerorts/außerorts wird erst beim Sicherheitstrennstreifen
  -- gebraucht (1,75 m bei Landstraßen).
  gemeinsamer_geh_und_radweg = { regelmass = 2.50, mindestmass = nil, klammerwert = nil, markiert = false },
}

---@class EraWidthRequirements
---@field ERA_MARKING_WIDTH number
---@field requirements table<EraAnlagentyp, EraWidthRequirement>
---@type EraWidthRequirements
return {
  ERA_MARKING_WIDTH = ERA_MARKING_WIDTH,
  requirements = requirements,
}
