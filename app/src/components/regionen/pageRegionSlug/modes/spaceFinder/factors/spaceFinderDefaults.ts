import type { VariantFactorConfig } from '@/server/space-finder/mergeFactorConfig'
import type { FactorConfig } from '@/server/space-finder/schemas'
import type { SpaceFinderUseCase } from '@/server/space-finder/spaceFinderFormSchemas'
import { SPACE_FINDER_USE_CASE_LABELS } from '@/shared/regionen/spaceFinderScoreLabels.const'
import { DEFAULT_OEPNV_SHARES } from './oepnvCategories'
import { DEFAULT_ZIELORT_SHARES } from './zielortCategories'

// Default factor template (mirrors scoring/config.py USE_CASE_FAHRRADBOX).
export const DEFAULT_FACTOR_TEMPLATE: VariantFactorConfig = {
  name: 'Fahrradbox',
  h3_resolution: 13,
  dem_source: 'mapterhorn',
  // Criteria sit on the UI grid 0–10 (multiples of 0.1); only their ratio matters, because
  // scorer.py divides by the sum of active weights — so cycleway proximity weighs twice as much
  // as slope and public transport here. The other weights (incl. target locations) are
  // bonuses/penalties and mean "up to w × 100 points" (see `weightScale.ts`).
  weights: {
    w_cyclepath: 0.2,
    w_target: 0.1,
    w_slope: 0.1,
    w_transit: 0.1,
    w_vegetation: 0,
    w_intersection: 0.1,
    w_parken: 0.1,
    w_platz: 0,
    w_fussgaengerzone: 0.1,
    w_bestand: 0,
    w_bewohnerbedarf: 0,
  },
  vegetation_direction: 'negative',
  platz_direction: 'positive',
  cir_source: 'auto' as const,
  max_cyclepath_dist_m: 50,
  exclude_carriageways: false,
  intersection_radius_m: 20,
  parken_radius_m: 15,
  fussgaengerzone_radius_m: 20,
  bestand_default_diameter_m: 20,
  // Equal split of the four target location types: the factor behaves as it did before
  // category weighting (see `zielortShares.ts`).
  zielort_category_shares: { ...DEFAULT_ZIELORT_SHARES },
  // 50/50 between public transport and bike sharing — UNLIKE target locations, NOT the behavior
  // from before category weighting (see `oepnvCategories.ts`).
  oepnv_category_shares: { ...DEFAULT_OEPNV_SHARES },
  // `bewohnerbedarf_saettigung_ew` is deliberately missing: without a value in the variant config,
  // the Planungsgebiet's census suggestion applies (see `mergeFactorConfig`). Only once someone
  // edits the field by hand does the variant hold a number.
  min_score_threshold: 60,
}

// TODO Flächenfinder: the "Art & Größe der gesuchten Fläche" selection is temporarily disabled.
// Reason: the selection is saved on the Planungsgebiet but so far has no effect on the score or
// the area search. Until the automatic area search uses it, we hide the fields — all the code
// (state, server fields, DB columns) intentionally stays.
// To re-enable: set this to `true`; the UI is in `AreaFormFields.tsx`, fed from
// `AreaWizard.tsx` and `AreaEditor.tsx`. The defaults below then apply again.
export const SHOW_SPACE_FINDER_USE_CASE_UI = false

// Use cases for the Planungsgebiet ("Art & Größe der gesuchten Fläche").
// `defaultAreaM2` is the prefilled area size; "Sonstiges" has no default, the size is entered
// freely. The area is stored on the Planungsgebiet (not in the variant factorConfig) and is
// currently only saved — preparation for the future automatic area search.
export type { SpaceFinderUseCase }

export const SPACE_FINDER_USE_CASES: {
  key: SpaceFinderUseCase
  label: string
  defaultAreaM2: number | null
}[] = [
  { key: 'fahrradbox', label: SPACE_FINDER_USE_CASE_LABELS.fahrradbox!, defaultAreaM2: 2 },
  {
    key: 'fahrradabstellanlage',
    label: SPACE_FINDER_USE_CASE_LABELS.fahrradabstellanlage!,
    defaultAreaM2: 20,
  },
  {
    key: 'mobilitaetsstation',
    label: SPACE_FINDER_USE_CASE_LABELS.mobilitaetsstation!,
    defaultAreaM2: 50,
  },
  { key: 'sonstiges', label: SPACE_FINDER_USE_CASE_LABELS.sonstiges!, defaultAreaM2: null },
]

export const GROUP_HELP: Record<'bedarf' | 'bebauung' | 'eigendaten', string> = {
  bedarf:
    'Wo würden Menschen eine Abstellanlage nutzen? Hier zählt die Lage im Netz: Radwege und ÖPNV, plus Zuschläge an Fußgängerzonen, rund um bewohnte Gebäude und rund um Gebäude mit Alltagszielen sowie ein Abzug, wo schon Anlagen stehen.',
  bebauung:
    'Wo lässt sich baulich etwas errichten? Die Hangneigung bildet den Grund, Vegetation, Kreuzungen, Parkflächen und Plätze schieben danach Punkte. Gebäude und zu steile Lagen schließen die Fläche ganz aus — der Bedarf bleibt davon unberührt.',
  eigendaten:
    'Ihre hochgeladenen Datensätze greifen in den Gesamtscore ein, ohne Bedarf oder Bebauung zu verändern. Jeder Datensatz hat einen Namen und wirkt einzeln mit eigenem Modus und eigener Stärke — so lassen sich Wunschstandorte, Tabuzonen oder eigene Planungen nebeneinander berücksichtigen.',
}

/** Referenced from other panel texts (tooltips), so a rename here shows up there. */
export const MIN_SCORE_THRESHOLD_LABEL = 'Mindest-Score (Flächensuche)'
export const MIN_AREA_FILTER_LABEL = 'Fläche suchen'

export const FACTOR_HELP: Record<string, string> = {
  w_cyclepath:
    'Nähe zu Radwegen hebt den Bedarf: volle Punkte bis 20 m, danach abnehmend bis zur Maximaldistanz. Nach der Berechnung eingeblendet: „Radinfrastruktur“.',
  w_transit:
    'Nähe zu ÖPNV-Haltestellen und Bikesharing-Stationen hebt den Bedarf. „ÖPNV-Arten“ legt das Verhältnis der beiden fest. Nach der Berechnung eingeblendet: „ÖPNV-Haltepunkte und Fähranleger“ und „Fahrrad- & Mikromobilitätsparken“ bzw. „Fahrradparken / Anzahl Stellplätze“.',
  w_target:
    'Gebäude mit Alltagszielen geben direkt daneben einen Zuschlag, bis 20 m abnehmend. „Zielort-Arten“ legt das Verhältnis der vier Arten fest. Nach der Berechnung eingeblendet: „Quellen & Ziele“.',
  w_fussgaengerzone:
    'Zuschlag an Ecken, wo eine Straße auf eine Fußgängerzone trifft: voll rund 5–8 m von der Ecke, bis zum Radius abnehmend.',
  w_bestand:
    'Bestehende Fahrradabstellanlagen ziehen Punkte ab: voller Abzug im Einzugskreis (aus der Kapazität, sonst Standard-Durchmesser). Nach der Berechnung eingeblendet: „Fahrrad- & Mikromobilitätsparken“ bzw. „Fahrradparken / Anzahl Stellplätze“.',
  w_slope:
    'Flaches Gelände (bis etwa 2°) ist ideal, ab etwa 10° ist die Fläche ausgeschlossen. Bei Gewicht 0 entfällt auch der Ausschluss.',
  w_vegetation:
    'Grünanteil aus Infrarot-Luftbildern: „Grün schützen“ zieht ab, „Grün bevorzugen“ gibt Zuschlag, je mehr Grün, desto stärker. Nach der Berechnung eingeblendet: „Vegetationsflächen“.',
  w_intersection:
    'Zuschlag an Straßenecken: voll rund 5–8 m von der Bordsteinecke, bis zum Radius abnehmend.',
  w_parken:
    'Kfz-Parkflächen eignen sich zur Umwidmung: voller Zuschlag direkt auf dem Parken, bis zum Radius abnehmend. Nach der Berechnung eingeblendet: „Öffentliches Straßenparken“ und „Öffentliches Parken abseits des Straßenraums“.',
  w_platz:
    'Auf Plätzen gibt „Belebung bevorzugen“ einen Zuschlag, „Platz freihalten“ einen Abzug — nur direkt auf dem Platz.',
  w_eigendaten:
    'Eigene Punkte, Linien oder Flächen: Bonus und Abzug verschieben den Score innerhalb, Ausschluss setzt ihn innen oder außen auf null. Dateien und Modus gelten am Planungsgebiet, die Stärke stellt jede Variante je Datensatz ein.',
  w_bewohnerbedarf:
    'Einwohner aus dem Zensus 2022 heben den Bedarf neben bewohnten Gebäuden, bis 20 m abnehmend; mehrere Gebäude addieren sich. Der Wert ist die Summe für den vollen Zuschlag, vorbelegt aus dem Zensus des Planungsgebiets. Nach der Berechnung eingeblendet: „Zensus-Einwohner“.',
  min_score_threshold: `Nur Flächen ab diesem Gesamtscore zählen zur zusammenhängenden Kandidatenfläche. Der Filter „${MIN_AREA_FILTER_LABEL}“ im Panel nutzt diese Cluster. Der Score selbst ändert sich dadurch nicht.`,
}

export const FACTOR_PARAMS: Record<
  string,
  { key: keyof FactorConfig; label: string; step: number; min?: number; alwaysEditable?: boolean }[]
> = {
  w_cyclepath: [{ key: 'max_cyclepath_dist_m', label: 'Max. Distanz (m)', step: 1, min: 0 }],
  w_fussgaengerzone: [{ key: 'fussgaengerzone_radius_m', label: 'Radius (m)', step: 1, min: 0 }],
  w_bestand: [
    { key: 'bestand_default_diameter_m', label: 'Standard-Durchmesser (m)', step: 1, min: 0 },
  ],
  w_intersection: [{ key: 'intersection_radius_m', label: 'Radius (m)', step: 1, min: 0 }],
  w_parken: [{ key: 'parken_radius_m', label: 'Radius (m)', step: 1, min: 0 }],
  // No entry for w_platz: no radius/distance decay, only effective directly on the square.
  // The 20 m radius is deliberately hard-wired (no UI field) and is a constant in
  // scoring/config.py. Only saturation is adjustable; its label names the unit, because
  // "Einwohner" alone doesn't show that the distance is already factored in.
  w_bewohnerbedarf: [
    {
      key: 'bewohnerbedarf_saettigung_ew',
      label: 'Voller Zuschlag ab (Einwohnern) bis 20 Meter Radius',
      step: 5,
      min: 0,
    },
  ],
  // No entry for w_target: radius (20 m) AND saturation (fixed 1.0) are both not adjustable
  // in the UI (see the comment in scoring/config.py).
}

/**
 * Configured reach of a factor, shown next to it in the hexagon inspector (read from the run
 * snapshot). `w_target` and `w_platz` have none (see the comments in `FACTOR_PARAMS`).
 * `bewohnerbedarf_radius_m` is not stored in variants (no UI field); the worker's fixed 20 m
 * (`UseCaseConfig.bewohnerbedarf_radius_m`) is the fallback.
 */
const FACTOR_RANGE_HINTS: Record<
  string,
  { key: keyof FactorConfig; prefix: string; fallbackM?: number }
> = {
  w_cyclepath: { key: 'max_cyclepath_dist_m', prefix: 'bis' },
  w_bestand: { key: 'bestand_default_diameter_m', prefix: 'Standard-Ø' },
  w_bewohnerbedarf: { key: 'bewohnerbedarf_radius_m', prefix: 'Radius', fallbackM: 20 },
  w_fussgaengerzone: { key: 'fussgaengerzone_radius_m', prefix: 'Radius' },
  w_intersection: { key: 'intersection_radius_m', prefix: 'Radius' },
  w_parken: { key: 'parken_radius_m', prefix: 'Radius' },
}

/** E.g. „bis 50 m“ / „Radius 20 m“; undefined when the factor has no configured reach. */
export const factorRangeHint = (weightKey: string, config: Partial<FactorConfig> | undefined) => {
  const hint = FACTOR_RANGE_HINTS[weightKey]
  if (!hint || !config) return undefined
  const value = config[hint.key] ?? hint.fallbackM
  return typeof value === 'number' ? `${hint.prefix} ${value.toLocaleString('de-DE')} m` : undefined
}

/** Factors that read `public._parking_*` tables (see `postgis_loader.py`) — the `parking` topic
 * only runs in fixed bboxes (`processing/constants/topics.const.ts`); outside them there is no
 * data. `parkingDataAvailable` (from `getSpaceFinderVariantFn`) hides these factors in
 * `FactorEditorPanel` instead of silently contributing 0. `exclude_carriageways` belongs here
 * too, but isn't a weight and is handled separately there. */
export const PARKING_DATA_DEPENDENT_KEYS = ['w_parken', 'w_intersection', 'w_fussgaengerzone']

export const WEIGHT_LABELS: Record<string, string> = {
  w_cyclepath: 'Radwegnähe',
  w_target: 'Zielorte',
  w_slope: 'Hangneigung',
  w_transit: 'ÖPNV + Bikesharing',
  w_vegetation: 'Vegetation',
  w_intersection: 'Kreuzungen',
  w_parken: 'Parken (Umwidmung)',
  w_platz: 'Plätze',
  w_fussgaengerzone: 'Fußgängerzonen',
  w_bestand: 'Bestandsanlagen',
  w_bewohnerbedarf: 'Bewohnerbedarf (Zensus)',
}

// Direction of a bonus/penalty. `vegetation`/`platz` mean "follows `vegetation_direction`" /
// "follows `platz_direction`" — only these two can be a bonus or a penalty depending on the
// setting.
export type ModifierDirection = 'positive' | 'negative' | 'vegetation' | 'platz'

// Factor → probability grouping (Issue #3415). The weight sliders and the
// per-hexagon sidebar breakdown are grouped by these two categories. Must stay in
// sync with the backend split in scoring/scorer.py (_group_score):
//   Bedarf   → Radwegnähe, ÖPNV + modifiers Bestandsanlagen (penalty), Bewohnerbedarf
//              (bonus), Zielorte (bonus) and Fußgängerzonen (bonus)
//   Bebauung → Hangneigung + modifiers
//              (Vegetation, Plätze, Kreuzungen, Parken)
//
// Within each group we also split by computation type, because the two types act differently
// in scorer.py and are therefore set differently (see `weightScale.ts`):
//   criteria  → weighted average of the 0–100 sub-scores; weight = share of the base score
//   modifiers → bonuses/penalties in points on the final score
export const WEIGHT_GROUPS: {
  key: 'bedarf' | 'bebauung'
  label: string
  criteria: string[]
  modifiers: { key: string; direction: ModifierDirection }[]
  // Announced but not yet integrated criteria (no weight, no score) — only shown as a
  // disabled row with a "bald verfügbar" hint (ComingSoonFactorRow).
  comingSoon?: string[]
}[] = [
  {
    key: 'bedarf',
    label: 'Bedarf',
    criteria: ['w_cyclepath', 'w_transit'],
    modifiers: [
      { key: 'w_bestand', direction: 'negative' },
      { key: 'w_bewohnerbedarf', direction: 'positive' },
      { key: 'w_target', direction: 'positive' },
      { key: 'w_fussgaengerzone', direction: 'positive' },
    ],
  },
  {
    key: 'bebauung',
    label: 'Bebauung',
    criteria: ['w_slope'],
    modifiers: [
      { key: 'w_vegetation', direction: 'vegetation' },
      { key: 'w_platz', direction: 'platz' },
      { key: 'w_intersection', direction: 'positive' },
      { key: 'w_parken', direction: 'positive' },
    ],
  },
]
