/**
 * Die zwei ÖPNV-Gruppen des Faktors „ÖPNV + Bikesharing" (`w_transit`).
 *
 * „ÖPNV" fasst die fünf klassischen Haltestellentypen (U-Bahn-Eingang, Straßenbahn, Bus, Bahnhof,
 * Bahnhofsgebäude) weiterhin über ein internes max() zusammen — der nächstgelegene Typ zählt.
 * „Bikesharing" (poiClassification, `*=bicycle_rental`) bleibt ein eigener Typ. Über
 * `oepnv_category_shares` lässt sich das Verhältnis der beiden Gruppen zueinander verschieben
 * (siehe `oepnvShares.ts` und `scorer.py`).
 *
 * Anders als bei den Zielort-Kategorien ist Gleichverteilung hier NICHT der Stand von vor der
 * Kategorie-Gewichtung: `score_oepnv` kombinierte die sechs Typen bisher über ein reines max(),
 * jetzt über die bei ihrem Anteil gewichtete Summe der beiden Gruppen, gekappt bei 100 — das
 * ändert bestehende Läufe auch bei 50/50 (User-Entscheid).
 */
export type OepnvCategory = 'ÖPNV' | 'Bikesharing'

export const OEPNV_CATEGORIES: {
  key: OepnvCategory
  label: string
  color: string
  help: string
}[] = [
  {
    key: 'ÖPNV',
    label: 'ÖPNV',
    color: '#2563eb',
    help: 'U-Bahn-Eingänge, Straßenbahnhaltestellen, Bushaltestellen, Bahnhöfe und Bahnhofsgebäude. Der nächstgelegene dieser Typen zählt, Bahnhöfe wirken am weitesten, Bushaltestellen am kleinräumigsten.',
  },
  {
    key: 'Bikesharing',
    label: 'Bikesharing',
    color: '#059669',
    help: 'Bikesharing-Stationen (Leihräder) aus OpenStreetMap, gleicher Radius wie Bushaltestellen.',
  },
]

export const OEPNV_CATEGORY_KEYS = OEPNV_CATEGORIES.map((category) => category.key)

/** Gleichverteilung — NICHT non-breaking (siehe Kommentar oben); Fallback für Varianten ohne das
 * neue Feld (`readOepnvShares`). */
export const DEFAULT_OEPNV_SHARES: Record<OepnvCategory, number> = {
  ÖPNV: 50,
  Bikesharing: 50,
}
