local era_anlagentyp = require('topics.roads_bikelanes.bikelanes.era_check.era_anlagentyp')
local era_width = require('topics.roads_bikelanes.bikelanes.era_check.era_width')

-- Prüft eine Radverkehrsanlage gegen die FGSV ERA 2010, Tabelle 5. Bewertet wird nur, was die Daten
-- hergeben: fehlende Angaben führen zu `unbekannt`, nie zu einem Mangel.
-- Aktuell nur die Breite; Sicherheitstrennstreifen und weitere Attribute kommen additiv dazu.
--
-- Innerorts/außerorts: `args.in_settlement_area` stammt aus dem Pseudo-Tag `_in_settlement_area`.
-- Das ist derzeit in `../../pseudo_tags/apply_pseudo_tags.lua` NICHT angehängt (siehe
-- private-issues#3051/#3423), der Wert ist im Betrieb also `nil` und der Check verhält sich wie
-- ohne Lage. Wird die Lage aktiviert, ruht das Urteil an den betroffenen Stellen auf einer
-- Annahme — dann muss die App sie sichtbar machen (`era_lage` + `era_width_confidence = low`).

---@class EraCheckArgs
---@field category_id string `bikelanes.category`
---@field width number|nil Ergebnis von `parse_length(tags.width)`
---@field oneway string|nil Ergebnis von `derive_oneway`
---@field has_opposite_side_infrastructure boolean|nil `nil` = unbekannt (eigenständige Geometrie)
---@field in_settlement_area string|nil Pseudo-Tag `_in_settlement_area`; heute immer `nil`, siehe unten

---@class EraCheckResult
---@field era_anlagentyp string|nil Semikolon-Liste der geprüften Anlagentypen; mehr als einer heißt "aus den Daten nicht eindeutig"
---@field era_lage EraLage|nil Nur gesetzt, wenn die (geschätzte) Lage den Anlagentyp bestimmt hat
---@field era_width_check EraWidthCheck|nil
---@field era_width_confidence 'high'|'low'|nil
---@field era_width_used number|nil
---@field era_width_regelmass number|nil

---@param args EraCheckArgs
---@return EraCheckResult
local function era_check(args)
  local candidates, assumed, lage = era_anlagentyp(args)
  local width_result = era_width(args.width, candidates)

  if width_result.era_width_check == 'nicht_anwendbar' then
    -- Tabelle 5 kennt für diese Führungsform kein Breitenmaß. Wir schreiben dann gar keine
    -- `era_*`-Tags, statt auf jeder zweiten Kante ein "nicht anwendbar" in die Tiles zu legen.
    -- Für die Anzeige heißt "kein `era_anlagentyp`" deshalb "keine ERA-Vorgabe".
    return {}
  end

  -- Alle geprüften Anlagentypen, nicht nur ein "nicht eindeutig": Solange wir beidseitige
  -- Zweirichtungsradwege nur bei seitenbezogenem Tagging erkennen, ist die Liste die einzige
  -- Möglichkeit, das Ergebnis selbst einzuschätzen.
  -- Ruht das Urteil auf einer angenommenen Verkehrsrichtung, ist es nur "vermutlich" richtig. Wo es
  -- gar kein Urteil gibt, wäre eine Konfidenz dazu sinnlos.
  local has_verdict = width_result.era_width_check ~= 'unbekannt'

  return {
    era_anlagentyp = table.concat(candidates, ';'),
    -- Die Lage steht nur da, wo sie das Ergebnis trägt; sie ist dann in der App als Annahme
    -- auszuweisen. Ein "wo liegt dieser Weg" gehört nicht in die `era_*`-Tags.
    era_lage = lage,
    era_width_check = width_result.era_width_check,
    era_width_confidence = has_verdict and (assumed and 'low' or 'high') or nil,
    era_width_used = width_result.era_width_used,
    era_width_regelmass = width_result.era_width_regelmass,
  }
end

return era_check
