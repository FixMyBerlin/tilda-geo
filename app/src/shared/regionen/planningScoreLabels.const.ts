/** German labels for the persisted per-hexagon scores (`planning.scenario_hexagons`). */
export const PLANNING_SCORE_LABELS: Record<string, string> = {
  score_bedarf: 'Bedarf',
  score_bebauung: 'Bebauung',
  score_radweg: 'Radweg',
  score_hangneigung: 'Hangneigung',
  score_oepnv: 'ÖPNV + Bikesharing',
  score_zielorte: 'Zielorte',
  score_vegetation: 'Vegetation',
  score_kreuzung: 'Kreuzungen',
  score_parken: 'Parken',
  score_platz: 'Plätze',
  score_fussgaengerzone: 'Fußgängerzonen',
  score_bestand: 'Bestandsanlagen',
  score_eigendaten: 'Eigene Daten',
  score_bewohnerbedarf: 'Bewohnerbedarf (Zensus)',
}

/** 0–100 sub-scores (weighted average into Bedarf / Bebauung). */
export const PLANNING_CRITERION_SCORE_KEYS = ['score_radweg', 'score_oepnv', 'score_hangneigung']

/** Signed point bonuses/maluses on top of the criteria. */
export const PLANNING_MODIFIER_SCORE_KEYS = [
  'score_fussgaengerzone',
  'score_bewohnerbedarf',
  'score_zielorte',
  'score_bestand',
  'score_vegetation',
  'score_platz',
  'score_kreuzung',
  'score_parken',
  'score_eigendaten',
]

/** German labels for `PlanningArea.useCase`. */
export const PLANNING_USE_CASE_LABELS: Record<string, string> = {
  fahrradbox: 'Fahrradboxen',
  fahrradabstellanlage: 'Fahrradabstellanlage',
  mobilitaetsstation: 'Mobilitätsstationen',
  sonstiges: 'Sonstiges',
}
