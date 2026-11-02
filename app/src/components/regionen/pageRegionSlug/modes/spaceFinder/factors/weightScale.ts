import { WEIGHT_GROUPS, type ModifierDirection } from './spaceFinderDefaults'

// Weights are stored internally as 0–1 (what the worker expects). In the UI, though, the two
// factor kinds have different units because scorer.py treats them differently:
//   Criteria      → importance 0–10. They feed into the weighted average of the 0–100
//                   Teilscores; the scorer divides by the sum of active weights. Only their
//                   ratio matters, so the meaningful value is the derived share of the base
//                   score (`criterionShares`).
//   Modifiers     → points 0–50 (bonus/penalty). They shift the final score by up to
//                   `w × 100` points; here the absolute value is what counts.
export const WEIGHT_STEPS = 10

/** 0–1 weight → integer UI step 0–10 (legacy values like 0.15 are shown rounded). */
export const weightToStep = (weight: number | undefined) =>
  Math.min(WEIGHT_STEPS, Math.max(0, Math.round((weight ?? 0) * WEIGHT_STEPS)))

/** UI step 0–10 → 0–1 weight. */
export const stepToWeight = (step: number) => step / WEIGHT_STEPS

export const MODIFIER_MAX_POINTS = 50
export const MODIFIER_POINT_STEP = 5

/** 0–1 weight → maximum effect in points (scorer.py uses `w × 100`). */
export const weightToPoints = (weight: number | undefined) =>
  Math.min(MODIFIER_MAX_POINTS, Math.max(0, Math.round((weight ?? 0) * 100)))

/** Points → 0–1 weight. */
export const pointsToWeight = (points: number) => points / 100

const CRITERION_WEIGHT_KEYS = WEIGHT_GROUPS.flatMap((group) => group.criteria)

type Weights = Record<string, number | undefined> | undefined

/**
 * Share of each criterion in the base score, in percent. Computed on the UI steps (not the 0–1
 * weights) so the displayed percentages match the slider positions exactly — also for legacy
 * values off the 0.1 grid. Without any weighted criterion: 0 everywhere.
 */
export const criterionShares = (weights: Weights) => {
  const steps = CRITERION_WEIGHT_KEYS.map((key) => weightToStep(weights?.[key]))
  const total = steps.reduce((sum, step) => sum + step, 0)
  return Object.fromEntries(
    CRITERION_WEIGHT_KEYS.map((key, index) => [key, total > 0 ? (steps[index]! / total) * 100 : 0]),
  ) as Record<string, number>
}

/** Configurable directions for modifier types without a fixed `positive`/`negative` direction
 * (see `ModifierDirection`). Key = the value of `direction` in `WEIGHT_GROUPS`. */
export type DirectionOverrides = {
  vegetation: 'positive' | 'negative'
  platz: 'positive' | 'negative'
}

/** Effective direction of a modifier; `vegetation`/`platz` follow their configured direction. */
export const resolveModifierDirection = (
  direction: ModifierDirection,
  directions: DirectionOverrides,
) => (direction === 'vegetation' || direction === 'platz' ? directions[direction] : direction)

/** Summed share of a factor group ("Bedarf" or "Bebauung") in the base score, in percent. */
export const groupShare = (shares: Record<string, number>, criteriaKeys: string[]) =>
  criteriaKeys.reduce((sum, key) => sum + (shares[key] ?? 0), 0)

/**
 * Maximum shift of the base score by the modifiers, in points. The total score is clamped to
 * 0–100 afterwards, so the range is an upper bound, not an exact value.
 * `w_eigendaten` is deliberately excluded: its own category with its own block in the UI.
 */
export const modifierPointRange = (weights: Weights, directions: DirectionOverrides) => {
  let plus = 0
  let minus = 0
  for (const group of WEIGHT_GROUPS) {
    for (const { key, direction } of group.modifiers) {
      const points = weightToPoints(weights?.[key])
      if (resolveModifierDirection(direction, directions) === 'positive') plus += points
      else minus += points
    }
  }
  return { plus, minus }
}
