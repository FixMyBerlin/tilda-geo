/**
 * The two transit groups of the factor „ÖPNV + Bikesharing" (`w_transit`).
 *
 * „ÖPNV" still combines the five classic stop types (subway entrance, tram, bus, station,
 * station building) via an internal max() — the nearest type counts.
 * „Bikesharing" (`bicycleParking_points` with `kind=bicycle_rental`) stays a separate type.
 * `oepnv_category_shares` shifts the ratio between the two groups
 * (see `oepnvShares.ts` and `scorer.py`).
 *
 * Unlike the target location categories, an equal split here is NOT the state before category
 * weighting: `score_oepnv` used to combine the six types via a plain max(), now via the
 * share-weighted sum of the two groups, capped at 100 — this changes existing runs even at
 * 50/50 (user decision).
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

/** Equal split — NOT non-breaking (see comment above); fallback for variants without the new
 * field (`readOepnvShares`). */
export const DEFAULT_OEPNV_SHARES: Record<OepnvCategory, number> = {
  ÖPNV: 50,
  Bikesharing: 50,
}
