import type { VariantFactorConfig } from '@/server/planning/mergeFactorConfig'
import type { FactorConfig } from '@/server/planning/planning.functions'

// Default factor template (mirrors flaechenfinder/config.py USE_CASE_FAHRRADBOX).
export const DEFAULT_FACTOR_TEMPLATE: VariantFactorConfig = {
  name: 'Fahrradbox',
  h3_resolution: 13,
  dem_source: 'mapterhorn',
  // Kriterien liegen auf dem UI-Raster 0–10 (Vielfache von 0.1); nur ihr Verhältnis zueinander
  // zählt, weil scorer.py durch die Summe der aktiven Gewichte teilt — Radwegnähe wiegt hier also
  // doppelt so schwer wie Hangneigung und ÖPNV. Die übrigen Gewichte (inkl. Zielorte) sind
  // Zu-/Abschläge und stehen für „bis zu w × 100 Punkte" (siehe `weightScale.ts`).
  weights: {
    w_cyclepath: 0.2,
    w_target: 0.1,
    w_slope: 0.1,
    w_transit: 0.1,
    w_vegetation: 0,
    w_intersection: 0.1,
    w_parken: 0.1,
    w_fussgaengerzone: 0.1,
    w_bestand: 0,
    w_bewohnerbedarf: 0,
  },
  vegetation_direction: 'negative',
  cir_source: 'auto' as const,
  max_cyclepath_dist_m: 50,
  exclude_carriageways: false,
  intersection_radius_m: 20,
  parken_radius_m: 15,
  fussgaengerzone_radius_m: 20,
  bestand_default_diameter_m: 20,
  // `bewohnerbedarf_saettigung_ew` fehlt hier bewusst: ohne Wert in der Varianten-Config gilt der
  // Zensus-Vorschlag des Planungsgebiets (siehe `mergeFactorConfig`). Erst wenn jemand das Feld
  // von Hand ändert, steht eine Zahl in der Variante.
  zielort_saettigung: 30,
  min_score_threshold: 60,
}

// TODO Flächenfinder: Auswahl „Art & Größe der gesuchten Fläche“ ist vorübergehend deaktiviert.
// Grund: Die Auswahl wird zwar am Planungsgebiet gespeichert, hat aber bisher keinen Effekt auf
// Score oder Flächensuche. Bis die automatische Flächensuche daran hängt, blenden wir die Felder
// aus — der komplette Code (State, Server-Felder, DB-Spalten) bleibt absichtlich bestehen.
// Zum Reaktivieren: hier auf `true` setzen; die UI dazu steht in `AreaFormFields.tsx`, gespeist
// aus `AreaWizard.tsx` und `AreaEditor.tsx`. Dann greifen wieder die Defaults unten.
export const SHOW_PLANNING_USE_CASE_UI = false

// Anwendungsfälle für das Planungsgebiet ("Art & Größe der gesuchten Fläche").
// `defaultAreaM2` ist die vorbelegte Flächengröße; bei „Sonstiges“ gibt es keinen Default, die
// Größe wird frei eingegeben. Die Fläche liegt auf dem Planungsgebiet (nicht im variant
// factorConfig) und wird aktuell nur mitgespeichert — Vorbereitung für die künftige
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
    'Wo würden Menschen eine Abstellanlage nutzen? Hier zählt die Lage im Netz: Radwege und ÖPNV, plus Zuschläge an Fußgängerzonen, rund um bewohnte Gebäude und rund um Gebäude mit Alltagszielen sowie ein Abzug, wo schon Anlagen stehen.',
  bebauung:
    'Wo lässt sich baulich etwas errichten? Die Hangneigung bildet den Grund, Vegetation, Kreuzungen und Parkflächen schieben danach Punkte. Gebäude und zu steile Lagen schließen die Fläche ganz aus — der Bedarf bleibt davon unberührt.',
  eigendaten:
    'Ihre hochgeladenen Flächen greifen in den Gesamtscore ein, ohne Bedarf oder Bebauung zu verändern. Damit lassen sich Wunschstandorte, Tabuzonen oder eigene Planungen berücksichtigen.',
}

export const FACTOR_HELP: Record<string, string> = {
  w_cyclepath:
    'Vorhandene Radwege aus OpenStreetMap heben den Bedarf. Bis 20 m Entfernung gibt es die volle Punktzahl, danach fällt sie bis zur eingestellten Maximaldistanz auf null. Das Gewicht bestimmt, wie stark diese Nähe im Grundscore zählt.',
  w_transit:
    'Haltestellen von U-Bahn, Straßenbahn, Bus und Bahn sowie Bikesharing-Stationen in der Nähe heben den Bedarf. Je näher, desto höher; Bahnhöfe wirken weiter als Haltestellen, Bushaltestellen und Bikesharing am kleinräumigsten. Das Gewicht bestimmt den Anteil am Grundscore.',
  w_target:
    'Gebäude mit Alltagszielen (Grundversorgung, Bildung, Einkauf, Freizeit aus OpenStreetMap) heben den Bedarf in ihrer Nähe — unabhängig davon, wie viele Zielorte in einem Gebäude liegen. Jedes solche Gebäude wirkt 20 m weit: direkt an der Gebäudekante mit vollem Gewicht, auf halber Strecke nur noch zur Hälfte, ab 20 m gar nicht mehr. Mehrere Gebäude in Reichweite addieren sich. Der eingestellte Wert ist die Anzahl erreichbarer Zielort-Gebäude, ab der es den vollen Zuschlag gibt. Auf den Gebäuden selbst entsteht kein Bedarf, er beginnt erst unmittelbar daneben. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_fussgaengerzone:
    'An Ecken, wo eine normale Straße auf eine Fußgängerzone trifft, ist der Bedarf besonders hoch. Der volle Zuschlag liegt rund 5–8 m von der Ecke; bis zum Radius fällt er auf null. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  w_bestand:
    'Bestehende Fahrradabstellanlagen senken den Bedarf: wo schon geparkt werden kann, braucht es weniger neue Anlagen. Jede Anlage hat einen Einzugskreis (aus der Kapazität, sonst dem Standard-Durchmesser); darin voller Abzug, außerhalb keiner. Das Gewicht bestimmt, wie viele Punkte maximal abgezogen werden.',
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
  w_bewohnerbedarf:
    'Einwohnerzahlen aus dem Zensus 2022, auf einzelne Gebäude heruntergerechnet, heben den Bedarf dort, wo viele Menschen wohnen — unabhängig vom Alter. Jedes bewohnte Gebäude wirkt 20 m weit: direkt an der Gebäudekante mit seiner vollen Einwohnerzahl, auf halber Strecke nur noch zur Hälfte, ab 20 m gar nicht mehr. Ein Haus mit 100 Einwohnern zählt direkt daneben also 100, aus 10 m Entfernung 50. Mehrere Gebäude in Reichweite addieren sich. Der eingestellte Wert ist die Summe, ab der es den vollen Zuschlag gibt. Er wird je Planungsgebiet automatisch aus dem Zensus vorbelegt — so, dass ungefähr das dichteste Zehntel der bewohnten Fläche den vollen Zuschlag bekommt — und lässt sich überschreiben. Zur Einordnung: dichte Berliner Innenstadt landet bei etwa 20–25, ein Einfamilienhausgebiet bei etwa 5. Auf den Gebäuden selbst entsteht kein Bedarf, er beginnt erst unmittelbar daneben. Das Gewicht bestimmt, wie viele Punkte maximal dazukommen.',
  min_score_threshold:
    'Nur Flächen ab diesem Gesamtscore zählen zur zusammenhängenden Kandidatenfläche. Der Filter „Gesuchte Fläche (m²)“ im Panel nutzt diese Cluster. Der Score selbst ändert sich dadurch nicht.',
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
  // Der 20-m-Radius ist bewusst fest verdrahtet (kein UI-Feld) und steht als Konstante in
  // flaechenfinder/config.py. Einstellbar ist nur die Sättigung; ihr Label nennt die Einheit,
  // weil „Einwohner" allein nicht erkennen lässt, dass der Abstand schon eingerechnet ist.
  w_bewohnerbedarf: [
    {
      key: 'bewohnerbedarf_saettigung_ew',
      label: 'Voller Zuschlag ab (Einwohnern) bis 20 Meter Radius',
      step: 5,
      min: 0,
    },
  ],
  // Derselbe fest verdrahtete 20-m-Radius wie beim Bewohnerbedarf (siehe Kommentar dort);
  // einstellbar ist nur die Sättigung.
  w_target: [
    {
      key: 'zielort_saettigung',
      label: 'Voller Zuschlag ab (Zielort-Gebäuden) bis 20 Meter Radius',
      step: 5,
      min: 0,
    },
  ],
}

/** Faktoren, die `public._parking_*`-Tabellen lesen (siehe `postgis_loader.py`) — das
 * `parking`-Topic läuft nur in festen Bboxen (`processing/constants/topics.const.ts`), außerhalb
 * gibt es dort keine Daten. `parkingDataAvailable` (aus `getPlanningVariantFn`) blendet diese
 * Faktoren in `FactorEditorPanel` aus, statt lautlos 0 beizutragen. `exclude_carriageways` gehört
 * fachlich auch dazu, ist aber kein Gewicht und wird dort separat behandelt. */
export const PARKING_DATA_DEPENDENT_KEYS = ['w_parken', 'w_intersection', 'w_fussgaengerzone']

export const WEIGHT_LABELS: Record<string, string> = {
  w_cyclepath: 'Radwegnähe',
  w_target: 'Zielorte',
  w_slope: 'Hangneigung',
  w_transit: 'ÖPNV + Bikesharing',
  w_vegetation: 'Vegetation',
  w_intersection: 'Kreuzungen',
  w_parken: 'Parken (Umwidmung)',
  w_fussgaengerzone: 'Fußgängerzonen',
  w_bestand: 'Bestandsanlagen',
  w_bewohnerbedarf: 'Bewohnerbedarf (Zensus)',
}

// Wirkrichtung eines Zu-/Abschlags. `vegetation` steht für „richtet sich nach
// `vegetation_direction`" — nur die Vegetation kann je nach Einstellung Bonus oder Abzug sein.
export type ModifierDirection = 'positive' | 'negative' | 'vegetation'

// Factor → probability grouping (Issue #3415). The weight sliders and the
// per-hexagon sidebar breakdown are grouped by these two categories. Must stay in
// sync with the backend split in flaechenfinder/scorer.py (_group_score):
//   Bedarf   → Radwegnähe, ÖPNV + Modifier Fußgängerzonen (Zuschlag), Bewohnerbedarf
//              (Zuschlag), Zielorte (Zuschlag) und Bestandsanlagen (Abzug)
//   Bebauung → Hangneigung + Modifier
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
  // Angekündigte, aber noch nicht integrierte Kriterien (kein Gewicht, kein Score) — werden nur
  // als deaktivierte Zeile mit "bald verfügbar"-Hinweis angezeigt (ComingSoonFactorRow).
  comingSoon?: string[]
}[] = [
  {
    key: 'bedarf',
    label: 'Bedarf',
    criteria: ['w_cyclepath', 'w_transit'],
    modifiers: [
      { key: 'w_fussgaengerzone', direction: 'positive' },
      { key: 'w_bewohnerbedarf', direction: 'positive' },
      { key: 'w_target', direction: 'positive' },
      { key: 'w_bestand', direction: 'negative' },
    ],
  },
  {
    key: 'bebauung',
    label: 'Bebauung',
    criteria: ['w_slope'],
    modifiers: [
      { key: 'w_vegetation', direction: 'vegetation' },
      { key: 'w_intersection', direction: 'positive' },
      { key: 'w_parken', direction: 'positive' },
    ],
  },
]
