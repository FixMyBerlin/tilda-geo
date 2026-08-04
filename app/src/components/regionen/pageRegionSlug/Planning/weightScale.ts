import { WEIGHT_GROUPS, type ModifierDirection } from './planningDefaults'

// Gewichte werden intern als 0–1 gespeichert (so erwartet es der Worker). In der UI haben die
// beiden Faktorarten aber unterschiedliche Einheiten, weil sie in scorer.py unterschiedlich
// rechnen:
//   Kriterien     → Wichtigkeit 0–10. Sie gehen in den gewichteten Durchschnitt der
//                   0–100-Teilscores ein, der Scorer teilt durch die Summe der aktiven
//                   Gewichte. Nur das Verhältnis zueinander zählt; der aussagekräftige Wert ist
//                   deshalb der daraus abgeleitete Anteil am Grundscore (`criterionShares`).
//   Zu-/Abschläge → Punkte 0–50. Sie verschieben den fertigen Score um bis zu `w × 100`
//                   Punkte; hier ist der absolute Wert die Aussage.
export const WEIGHT_STEPS = 10

/** 0–1-Gewicht → ganzzahlige UI-Stufe 0–10 (Altwerte wie 0.15 werden gerundet angezeigt). */
export const weightToStep = (weight: number | undefined) =>
  Math.min(WEIGHT_STEPS, Math.max(0, Math.round((weight ?? 0) * WEIGHT_STEPS)))

/** UI-Stufe 0–10 → 0–1-Gewicht. */
export const stepToWeight = (step: number) => step / WEIGHT_STEPS

export const MODIFIER_MAX_POINTS = 50
export const MODIFIER_POINT_STEP = 5

/** 0–1-Gewicht → maximaler Effekt in Punkten (scorer.py rechnet mit `w × 100`). */
export const weightToPoints = (weight: number | undefined) =>
  Math.min(MODIFIER_MAX_POINTS, Math.max(0, Math.round((weight ?? 0) * 100)))

/** Punkte → 0–1-Gewicht. */
export const pointsToWeight = (points: number) => points / 100

const CRITERION_WEIGHT_KEYS = WEIGHT_GROUPS.flatMap((group) => group.criteria)

type Weights = Record<string, number | undefined> | undefined

/**
 * Anteil jedes Kriteriums am Grundscore in Prozent. Gerechnet wird auf den UI-Stufen (nicht auf
 * den 0–1-Gewichten), damit die angezeigten Prozente exakt zu den Reglerpositionen passen — auch
 * bei Altwerten, die nicht auf dem 0.1-Raster liegen. Ohne gewichtetes Kriterium: überall 0.
 */
export const criterionShares = (weights: Weights) => {
  const steps = CRITERION_WEIGHT_KEYS.map((key) => weightToStep(weights?.[key]))
  const total = steps.reduce((sum, step) => sum + step, 0)
  return Object.fromEntries(
    CRITERION_WEIGHT_KEYS.map((key, index) => [key, total > 0 ? (steps[index]! / total) * 100 : 0]),
  ) as Record<string, number>
}

/** Wirkrichtung eines Modifiers; `vegetation` folgt der eingestellten Vegetationsrichtung. */
export const resolveModifierDirection = (
  direction: ModifierDirection,
  vegetationDirection: 'positive' | 'negative',
) => (direction === 'vegetation' ? vegetationDirection : direction)

/** Summierter Anteil einer Faktorgruppe (Bedarf bzw. Bebauung) am Grundscore, in Prozent. */
export const groupShare = (shares: Record<string, number>, criteriaKeys: string[]) =>
  criteriaKeys.reduce((sum, key) => sum + (shares[key] ?? 0), 0)

/**
 * Wie weit die Zu-/Abschläge den Grundscore maximal verschieben können, in Punkten. Der
 * Gesamtscore wird danach auf 0–100 gekappt, die Spanne ist also eine Ober-, keine Punktgrenze.
 * `w_eigendaten` zählt bewusst nicht mit: eigene Kategorie mit eigenem Block in der UI.
 */
export const modifierPointRange = (
  weights: Weights,
  vegetationDirection: 'positive' | 'negative',
) => {
  let plus = 0
  let minus = 0
  for (const group of WEIGHT_GROUPS) {
    for (const { key, direction } of group.modifiers) {
      const points = weightToPoints(weights?.[key])
      if (resolveModifierDirection(direction, vegetationDirection) === 'positive') plus += points
      else minus += points
    }
  }
  return { plus, minus }
}
