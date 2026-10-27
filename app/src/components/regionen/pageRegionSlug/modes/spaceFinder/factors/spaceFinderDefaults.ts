import type { VariantFactorConfig } from '@/server/planning/mergeFactorConfig'
import type { FactorConfig } from '@/server/planning/planning.functions'
import type { PlanningUseCase } from '@/server/planning/planningFormSchemas'
import { PLANNING_USE_CASE_LABELS } from '@/shared/regionen/planningScoreLabels.const'
import { DEFAULT_OEPNV_SHARES } from './oepnvCategories'
import { DEFAULT_ZIELORT_SHARES } from './zielortCategories'

// Default factor template (mirrors flaechenfinder/config.py USE_CASE_FAHRRADBOX).
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
  // the planning area's census suggestion applies (see `mergeFactorConfig`). Only once someone
  // edits the field by hand does the variant hold a number.
  min_score_threshold: 60,
}

// TODO Flächenfinder: the "Art & Größe der gesuchten Fläche" selection is temporarily disabled.
// Reason: the selection is saved on the planning area but so far has no effect on the score or
// the area search. Until the automatic area search uses it, we hide the fields — all the code
// (state, server fields, DB columns) intentionally stays.
// To re-enable: set this to `true`; the UI is in `AreaFormFields.tsx`, fed from
// `AreaWizard.tsx` and `AreaEditor.tsx`. The defaults below then apply again.
export const SHOW_PLANNING_USE_CASE_UI = false

// Use cases for the planning area ("Art & Größe der gesuchten Fläche").
// `defaultAreaM2` is the prefilled area size; "Sonstiges" has no default, the size is entered
// freely. The area is stored on the planning area (not in the variant factorConfig) and is
// currently only saved — preparation for the future automatic area search.
export type { PlanningUseCase }

export const PLANNING_USE_CASES: {
  key: PlanningUseCase
  label: string
  defaultAreaM2: number | null
}[] = [
  { key: 'fahrradbox', label: PLANNING_USE_CASE_LABELS.fahrradbox!, defaultAreaM2: 2 },
  {
    key: 'fahrradabstellanlage',
    label: PLANNING_USE_CASE_LABELS.fahrradabstellanlage!,
    defaultAreaM2: 20,
  },
  {
    key: 'mobilitaetsstation',
    label: PLANNING_USE_CASE_LABELS.mobilitaetsstation!,
    defaultAreaM2: 50,
  },
  { key: 'sonstiges', label: PLANNING_USE_CASE_LABELS.sonstiges!, defaultAreaM2: null },
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
    'Vorhandene Radwege aus OpenStreetMap heben den Bedarf. Bis 20 m Entfernung gibt es die volle Punktzahl, danach fällt sie bis zur eingestellten Maximaldistanz auf null. Das Gewicht bestimmt, wie stark diese Nähe im Grundscore zählt.',
  w_transit:
    'Haltestellen von U-Bahn, Straßenbahn, Bus und Bahn sowie Bikesharing-Stationen in der Nähe heben den Bedarf. Je näher, desto höher; Bahnhöfe wirken weiter als Haltestellen, Bushaltestellen und Bikesharing am kleinräumigsten. Das Gewicht bestimmt den Anteil am Grundscore. Unter „ÖPNV-Arten“ steht das Verhältnis von ÖPNV und Bikesharing zueinander: zusammen immer 100 %, wirksam nur in diesem Faktor.',
  w_target:
    'Gebäude mit Alltagszielen (Grundversorgung, Bildung, Einkauf, Freizeit) heben den Bedarf direkt daneben; der Zuschlag nimmt bis 20 m Abstand linear ab. Das Gewicht bestimmt die maximalen Punkte, „Zielort-Arten“ das Verhältnis der vier Arten (zusammen 100 %). Sichtbar in der Karte unter „Orte, Ziele, Grenzen“ → „Quellen & Ziele“.',
  w_fussgaengerzone:
    'An Ecken, wo eine normale Straße auf eine Fußgängerzone trifft, ist der Bedarf besonders hoch. Der volle Zuschlag liegt rund 5–8 m von der Ecke; bis zum Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_bestand:
    'Bestehende Fahrradabstellanlagen senken den Bedarf: wo schon geparkt werden kann, braucht es weniger neue Anlagen. Jede Anlage hat einen Einzugskreis (aus der Kapazität, sonst dem Standard-Durchmesser); darin voller Abzug, außerhalb keiner. Das Gewicht bestimmt, wie viele Punkte maximal abgezogen werden.',
  w_slope:
    'Die Geländeneigung kommt aus dem Höhenmodell. Flach (bis etwa 2°) ist ideal; ab etwa 10° wird die Fläche ganz ausgeschlossen. Das Gewicht bestimmt den Anteil am Grundscore; ist das Gewicht 0, ist Hangneigung wie jeder andere ausgeschaltete Faktor komplett wirkungslos – auch der Ausschluss steiler Lagen entfällt dann.',
  w_vegetation:
    'Aus Infrarot-Luftbildern wird der Grünanteil je Fläche geschätzt. „Grün schützen“ zieht Punkte ab, „Grün bevorzugen“ gibt Bonus — umso mehr, je höher die Bedeckung; kleine Grünreste bleiben ohne Effekt. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen oder abgezogen werden.',
  w_intersection:
    'Abstellanlagen an Straßenecken sind gut auffindbar und kurz anzufahren. Hexagone rund 5–8 m von der Bordsteinecke erhalten den vollen Bonus, bis zum eingestellten Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_parken:
    'Bestehende Kfz-Parkflächen am Straßenrand und auf Parkplätzen eignen sich zur Umwidmung. Liegt die Fläche direkt auf dem Parken, gibt es den vollen Zuschlag; bis zum Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_platz:
    '„Belebung bevorzugen" gibt Bonus auf Plätzen (place=square aus OpenStreetMap), „Platz freihalten" zieht dort Punkte ab. Liegt die Fläche direkt auf dem Platz, gibt es den vollen Effekt; außerhalb keinen. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen oder abgezogen werden.',
  w_eigendaten:
    'Laden Sie eigene Punkte, Linien oder Flächen hoch — auch mehrere Dateien, jede mit eigenem Namen. Bonus und Abzug verschieben den Gesamtscore innerhalb der Fläche, mehrere Datensätze addieren sich; Ausschluss innen oder außen setzt ihn dort auf null. Punkte werden mit 1,5 m, Linien mit 2,5 m verbreitert. Dateien und Modus legen Sie am Planungsgebiet fest (gilt für alle Varianten); die Stärke für Bonus und Abzug stellt jede Variante hier je Datensatz ein.',
  w_bewohnerbedarf:
    'Einwohnerzahlen aus dem Zensus 2022, auf einzelne Gebäude heruntergerechnet, heben den Bedarf dort, wo viele Menschen wohnen — unabhängig vom Alter. Jedes bewohnte Gebäude wirkt 20 m weit: direkt an der Gebäudekante mit seiner vollen Einwohnerzahl, auf halber Strecke nur noch zur Hälfte, ab 20 m gar nicht mehr. Ein Haus mit 100 Einwohnern zählt direkt daneben also 100, aus 10 m Entfernung 50. Mehrere Gebäude in Reichweite addieren sich. Der eingestellte Wert ist die Summe, ab der es den vollen Zuschlag gibt. Er wird je Planungsgebiet automatisch aus dem Zensus vorbelegt — so, dass ungefähr das dichteste Zehntel der bewohnten Fläche den vollen Zuschlag bekommt — und lässt sich überschreiben. Zur Einordnung: dichte Berliner Innenstadt landet bei etwa 20–25, ein Einfamilienhausgebiet bei etwa 5. Auf den Gebäuden selbst entsteht kein Bedarf, er beginnt erst unmittelbar daneben. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
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
  // flaechenfinder/config.py. Only saturation is adjustable; its label names the unit, because
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
  // in the UI (see the comment in flaechenfinder/config.py).
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
 * data. `parkingDataAvailable` (from `getPlanningVariantFn`) hides these factors in
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
// sync with the backend split in flaechenfinder/scorer.py (_group_score):
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
