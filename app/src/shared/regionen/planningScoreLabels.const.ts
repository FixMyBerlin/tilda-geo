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

/**
 * The score breakdown of a hexagon in display order: per group (Bedarf, Bebauung) the 0–100
 * criteria (weighted average into the group score), then the signed point bonuses/maluses on top.
 * Shared by the hexagon inspector and the Prüfliste take-over so both show the same hierarchy.
 */
export const PLANNING_SCORE_GROUPS: {
  /** Same keys as `WEIGHT_GROUPS` — ties the breakdown to the variant weights and group colors. */
  key: 'bedarf' | 'bebauung'
  label: string
  /** Persisted sub-score of the whole group. */
  scoreKey: string
  criteria: string[]
  modifiers: string[]
  /** Announced but not yet integrated criteria (no data on the hexagon). */
  comingSoon?: string[]
}[] = [
  {
    key: 'bedarf',
    label: 'Bedarf',
    scoreKey: 'score_bedarf',
    criteria: ['score_radweg', 'score_oepnv'],
    modifiers: ['score_fussgaengerzone', 'score_bewohnerbedarf', 'score_zielorte', 'score_bestand'],
  },
  {
    key: 'bebauung',
    label: 'Bebauung',
    scoreKey: 'score_bebauung',
    criteria: ['score_hangneigung'],
    modifiers: ['score_vegetation', 'score_platz', 'score_kreuzung', 'score_parken'],
  },
]

/** German labels for `PlanningArea.useCase`. */
export const PLANNING_USE_CASE_LABELS: Record<string, string> = {
  fahrradbox: 'Fahrradboxen',
  fahrradabstellanlage: 'Fahrradabstellanlage',
  mobilitaetsstation: 'Mobilitätsstationen',
  sonstiges: 'Sonstiges',
}
