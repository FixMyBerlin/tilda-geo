/**
 * TODO Flächenfinder: DUMMY criteria — replace with the criteria worked out with Sine.
 *
 * One list for every Planungsgebiet on purpose: the use-case selection ("Art & Größe der gesuchten
 * Fläche") is hidden (`SHOW_PLANNING_USE_CASE_UI = false`), so every area is stored as `fahrradbox`
 * and a list per use case would never be picked. Split this per `PlanningArea.useCase` once the
 * selection is available.
 *
 * `id` is stable on purpose (a later "tick off" feature can refer to it); `label` is shown.
 */
export const SPACE_FINDER_CHECKLIST: readonly { id: string; label: string }[] = [
  { id: 'platzhalter_1', label: 'Fläche ist frei und nicht anderweitig genutzt' },
  { id: 'platzhalter_2', label: 'Zugang ist gut erreichbar und barrierefrei' },
  { id: 'platzhalter_3', label: 'Keine Konflikte mit Geh- und Fahrwegen' },
  { id: 'platzhalter_4', label: 'Standort ist einsehbar und beleuchtet' },
]
