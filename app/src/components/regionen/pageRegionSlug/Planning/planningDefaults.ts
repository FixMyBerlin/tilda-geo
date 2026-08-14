import type { VariantFactorConfig } from '@/server/planning/mergeFactorConfig'
import type { FactorConfig } from '@/server/planning/planning.functions'

// Default factor template (mirrors flaechenfinder/config.py USE_CASE_FAHRRADBOX).
export const DEFAULT_FACTOR_TEMPLATE: VariantFactorConfig = {
  name: 'Fahrradbox',
  h3_resolution: 13,
  dem_source: 'mapterhorn',
  // Kriterien liegen auf dem UI-Raster 0–10 (Vielfache von 0.1); nur ihr Verhältnis zueinander
  // zählt, weil scorer.py durch die Summe der aktiven Gewichte teilt — Radwegnähe und Untergrund
  // wiegen hier also doppelt so schwer wie Zielorte, Hangneigung und ÖPNV. Die übrigen Gewichte
  // sind Zu-/Abschläge und stehen für „bis zu w × 100 Punkte" (siehe `weightScale.ts`).
  weights: {
    w_cyclepath: 0.2,
    w_surface: 0.2,
    w_target: 0.1,
    w_slope: 0.1,
    w_transit: 0.1,
    w_vegetation: 0,
    w_intersection: 0.1,
    w_parken: 0.1,
    w_fussgaengerzone: 0.1,
    w_bestand: 0,
  },
  vegetation_direction: 'negative',
  cir_source: 'auto' as const,
  max_cyclepath_dist_m: 50,
  min_surface_score: 30,
  exclude_carriageways: false,
  intersection_radius_m: 20,
  parken_radius_m: 15,
  fussgaengerzone_radius_m: 20,
  bestand_default_diameter_m: 20,
  min_score_threshold: 60,
  targets: [],
}

// Anwendungsfälle für Schritt 2 des Planungsassistenten ("Art & Größe der gesuchten Fläche").
// `defaultAreaM2` ist die vorbelegte Flächengröße; bei „Sonstiges“ gibt es keinen Default, die
// Größe wird frei eingegeben. Die Fläche wird aktuell nur im factorConfig mitgespeichert
// (passthrough) und noch nicht vom Worker ausgewertet — Vorbereitung für die künftige
// automatische Flächensuche.
export type PlanningUseCase =
  | 'fahrradbox'
  | 'fahrradabstellanlage'
  | 'mobilitaetsstation'
  | 'sonstiges'

export const PLANNING_USE_CASES: {
  key: PlanningUseCase
  label: string
  defaultAreaM2: number | null
}[] = [
  { key: 'fahrradbox', label: 'Fahrradboxen', defaultAreaM2: 2 },
  { key: 'fahrradabstellanlage', label: 'Fahrradabstellanlage', defaultAreaM2: 20 },
  { key: 'mobilitaetsstation', label: 'Mobilitätsstationen', defaultAreaM2: 50 },
  { key: 'sonstiges', label: 'Sonstiges', defaultAreaM2: null },
]

export const GROUP_HELP: Record<'bedarf' | 'bebauung' | 'eigendaten', string> = {
  bedarf:
    'Wo würden Menschen eine Abstellanlage nutzen? Hier zählt die Lage im Netz: Radwege, ÖPNV, Zielorte, plus ein Zuschlag an Fußgängerzonen und ein Abzug, wo schon Anlagen stehen.',
  bebauung:
    'Wo lässt sich baulich etwas errichten? Untergrund und Hangneigung bilden den Grund, Vegetation, Kreuzungen und Parkflächen schieben danach Punkte. Gebäude und zu steile oder zu schlechte Böden schließen die Fläche ganz aus — der Bedarf bleibt davon unberührt.',
  eigendaten:
    'Ihre hochgeladenen Flächen greifen in den Gesamtscore ein, ohne Bedarf oder Bebauung zu verändern. Damit lassen sich Wunschstandorte, Tabuzonen oder eigene Planungen berücksichtigen.',
}

export const FACTOR_HELP: Record<string, string> = {
  w_cyclepath:
    'Vorhandene Radwege aus OpenStreetMap heben den Bedarf. Bis 20 m Entfernung gibt es die volle Punktzahl, danach fällt sie bis zur eingestellten Maximaldistanz auf null. Das Gewicht bestimmt, wie stark diese Nähe im Grundscore zählt.',
  w_transit:
    'Haltestellen von U-Bahn, Straßenbahn und Bahn in der Nähe heben den Bedarf. Je näher, desto höher; Bahnhöfe wirken weiter als Haltestellen. Das Gewicht bestimmt den Anteil am Grundscore.',
  w_target:
    'Nähe zu hinterlegten Alltagszielen hebt den Bedarf: innerhalb einer kurzen Distanz voll, danach abfallend. Das Gewicht bestimmt den Anteil am Grundscore. Ohne hinterlegte Zielorte bleibt der Faktor ohne Wirkung.',
  w_fussgaengerzone:
    'An Ecken, wo eine normale Straße auf eine Fußgängerzone trifft, ist der Bedarf besonders hoch. Der volle Zuschlag liegt rund 5–8 m von der Ecke; bis zum Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_bestand:
    'Bestehende Fahrradabstellanlagen senken den Bedarf: wo schon geparkt werden kann, braucht es weniger neue Anlagen. Jede Anlage hat einen Einzugskreis (aus der Kapazität, sonst dem Standard-Durchmesser); darin voller Abzug, außerhalb keiner. Das Gewicht bestimmt, wie viele Punkte maximal abgezogen werden.',
  w_surface:
    'Der in OpenStreetMap erfasste Belag (Asphalt, Pflaster, Schotter, …) bewertet, wie gut sich die Fläche bebauen lässt. Unter der Schwelle wird die Fläche ganz ausgeschlossen. Das Gewicht bestimmt den Anteil am Grundscore; die Ausschluss-Schwelle gilt auch bei Gewicht 0.',
  w_slope:
    'Die Geländeneigung kommt aus dem Höhenmodell. Flach (bis etwa 2°) ist ideal; ab etwa 8° wird die Fläche ganz ausgeschlossen. Das Gewicht bestimmt den Anteil am Grundscore; der Ausschluss steiler Lagen gilt immer.',
  w_vegetation:
    'Aus Infrarot-Luftbildern wird der Grünanteil je Fläche geschätzt. „Grün schützen“ zieht Punkte ab, „Grün bevorzugen“ gibt Bonus — umso mehr, je höher die Bedeckung; kleine Grünreste bleiben ohne Effekt. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen oder abgezogen werden.',
  w_intersection:
    'Abstellanlagen an Straßenecken sind gut auffindbar und kurz anzufahren. Hexagone rund 5–8 m von der Bordsteinecke erhalten den vollen Bonus, bis zum eingestellten Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_parken:
    'Bestehende Kfz-Parkflächen am Straßenrand und auf Parkplätzen eignen sich zur Umwidmung. Liegt die Fläche direkt auf dem Parken, gibt es den vollen Zuschlag; bis zum Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_eigendaten:
    'Laden Sie eigene Punkte, Linien oder Flächen hoch. Bonus und Abzug verschieben den Gesamtscore innerhalb der Fläche; Ausschluss innen oder außen setzt ihn dort auf null. Punkte werden mit 1,5 m, Linien mit 2,5 m verbreitert. Das Gewicht gilt nur für Bonus und Abzug.',
  min_score_threshold:
    'Nur Flächen ab diesem Gesamtscore zählen zur zusammenhängenden Kandidatenfläche. Der Filter „Gesuchte Fläche (m²)“ im Panel nutzt diese Cluster. Der Score selbst ändert sich dadurch nicht.',
}

export const FACTOR_PARAMS: Record<
  string,
  { key: keyof FactorConfig; label: string; step: number; alwaysEditable?: boolean }[]
> = {
  w_cyclepath: [{ key: 'max_cyclepath_dist_m', label: 'Max. Distanz (m)', step: 1 }],
  w_fussgaengerzone: [{ key: 'fussgaengerzone_radius_m', label: 'Radius (m)', step: 1 }],
  w_bestand: [{ key: 'bestand_default_diameter_m', label: 'Standard-Durchmesser (m)', step: 1 }],
  w_surface: [
    { key: 'min_surface_score', label: 'Min. Untergrund-Score', step: 1, alwaysEditable: true },
  ],
  w_intersection: [{ key: 'intersection_radius_m', label: 'Radius (m)', step: 1 }],
  w_parken: [{ key: 'parken_radius_m', label: 'Radius (m)', step: 1 }],
}

export const WEIGHT_LABELS: Record<string, string> = {
  w_cyclepath: 'Radwegnähe',
  w_surface: 'Untergrund',
  w_target: 'Zielorte',
  w_slope: 'Hangneigung',
  w_transit: 'ÖPNV',
  w_vegetation: 'Vegetation',
  w_intersection: 'Kreuzungen',
  w_parken: 'Parken (Umwidmung)',
  w_fussgaengerzone: 'Fußgängerzonen',
  w_bestand: 'Bestandsanlagen',
}

// Wirkrichtung eines Zu-/Abschlags. `vegetation` steht für „richtet sich nach
// `vegetation_direction`" — nur die Vegetation kann je nach Einstellung Bonus oder Abzug sein.
export type ModifierDirection = 'positive' | 'negative' | 'vegetation'

// Factor → probability grouping (Issue #3415). The weight sliders and the
// per-hexagon sidebar breakdown are grouped by these two categories. Must stay in
// sync with the backend split in flaechenfinder/scorer.py (_group_score):
//   Bedarf   → Radwegnähe, ÖPNV, Zielorte + Modifier Fußgängerzonen (Zuschlag)
//              und Bestandsanlagen (Abzug)
//   Bebauung → Untergrund, Hangneigung + Modifier
//              (Vegetation, Kreuzungen, Parken)
//
// Innerhalb der Gruppen trennen wir zusätzlich nach Rechenart, weil beide Arten in scorer.py
// unterschiedlich wirken und deshalb auch unterschiedlich eingestellt werden (siehe
// `weightScale.ts`):
//   criteria  → gewichteter Durchschnitt der 0–100-Teilscores; Gewicht = Anteil am Grundscore
//   modifiers → Zu-/Abschläge in Punkten auf den fertigen Score
export const WEIGHT_GROUPS: {
  key: 'bedarf' | 'bebauung'
  label: string
  criteria: string[]
  modifiers: { key: string; direction: ModifierDirection }[]
}[] = [
  {
    key: 'bedarf',
    label: 'Bedarf',
    criteria: ['w_cyclepath', 'w_transit', 'w_target'],
    modifiers: [
      { key: 'w_fussgaengerzone', direction: 'positive' },
      { key: 'w_bestand', direction: 'negative' },
    ],
  },
  {
    key: 'bebauung',
    label: 'Bebauung',
    criteria: ['w_surface', 'w_slope'],
    modifiers: [
      { key: 'w_vegetation', direction: 'vegetation' },
      { key: 'w_intersection', direction: 'positive' },
      { key: 'w_parken', direction: 'positive' },
    ],
  },
]
