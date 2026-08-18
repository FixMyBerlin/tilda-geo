local ERA = require('topics.roads_bikelanes.bikelanes.era_check.era_width_requirements')
local round = require('topics.helper.round')

---@alias EraWidthCheck 'regelmass'|'mindestmass'|'klammerwert'|'unterschritten'|'unbekannt'|'nicht_anwendbar'

-- Nur gegen Float-Artefakte (1.6 + 0.25 == 1.8499999999999999), keine Kulanz gegenüber der ERA.
local EPSILON = 0.001

---@class EraWidthResult
---@field era_width_check EraWidthCheck
---@field era_width_used number|nil Breite, die mit der Tabelle verglichen wurde (einschließlich Markierung)
---@field era_width_regelmass number|nil Regelmaß, an dem gemessen wurde

---@class EraWidthCandidateResult
---@field check EraWidthCheck
---@field used number
---@field regelmass number

---@param width number OSM-Breite, nach unserer Annahme ohne Markierung gemessen
---@param anlagentyp EraAnlagentyp
---@return EraWidthCandidateResult
local function evaluate(width, anlagentyp)
  local row = ERA.requirements[anlagentyp]
  -- Tabelle 5 misst einschließlich Markierung.
  local used = row.markiert and (width + ERA.ERA_MARKING_WIDTH) or width

  local check = 'unterschritten'
  if used + EPSILON >= row.regelmass then
    check = 'regelmass'
  elseif row.mindestmass ~= nil and used + EPSILON >= row.mindestmass then
    check = 'mindestmass'
  elseif row.klammerwert ~= nil and used + EPSILON >= row.klammerwert then
    check = 'klammerwert'
  end

  local used_rounded = round(used, 2)
  ---@cast used_rounded number
  return { check = check, used = used_rounded, regelmass = row.regelmass }
end

--- Prüft die Breite gegen die in Frage kommenden Zeilen der Tabelle 5.
--- Bei mehreren Kandidaten gilt ein Ergebnis nur, wenn es für alle gleich ausfällt – sonst reichen
--- die Daten für ein Urteil nicht aus.
---@param width number|nil
---@param candidates EraAnlagentyp[]
---@return EraWidthResult
local function era_width(width, candidates)
  if #candidates == 0 then
    return { era_width_check = 'nicht_anwendbar' }
  end
  if width == nil then
    return { era_width_check = 'unbekannt' }
  end

  ---@type EraWidthCandidateResult[]
  local results = {}
  for _, anlagentyp in ipairs(candidates) do
    table.insert(results, evaluate(width, anlagentyp))
  end

  -- Kandidaten mit unterschiedlicher Markierungsregel ergeben verschiedene Vergleichsbreiten; dann
  -- gibt es keine eine Breite, die wir ausweisen könnten.
  local used = results[1].used
  for _, result in ipairs(results) do
    if result.used ~= used then
      used = nil
    end
  end

  local verdict = results[1].check
  local representative = results[1]
  for _, result in ipairs(results) do
    if result.check ~= verdict then
      return { era_width_check = 'unbekannt', era_width_used = used }
    end
    -- Ausgewiesen wird das Regelmaß, das das Urteil trägt: bei erfülltem Regelmaß das strengste
    -- erfüllte, sonst das mildeste verfehlte.
    if verdict == 'regelmass' then
      if result.regelmass > representative.regelmass then
        representative = result
      end
    elseif result.regelmass < representative.regelmass then
      representative = result
    end
  end

  return {
    era_width_check = verdict,
    era_width_used = used,
    era_width_regelmass = representative.regelmass,
  }
end

return era_width
