import { WEIGHT_GROUPS } from './planningDefaults'

// Gewichte werden intern als 0–1 gespeichert (so erwartet es der Worker), in der UI aber als
// ganzzahlige Wichtigkeit 0–10 bedient: 0 = fließt nicht ein, 10 = das gesamte Budget.
export const WEIGHT_STEPS = 10

/** 0–1-Gewicht → ganzzahlige UI-Stufe 0–10 (Altwerte wie 0.15 werden gerundet angezeigt). */
export const weightToStep = (weight: number | undefined) =>
  Math.min(WEIGHT_STEPS, Math.max(0, Math.round((weight ?? 0) * WEIGHT_STEPS)))

/** UI-Stufe 0–10 → 0–1-Gewicht. */
export const stepToWeight = (step: number) => step / WEIGHT_STEPS

/**
 * Bedarf und Bebauung teilen sich ein festes Budget von 10 Stufen (= Gewichtssumme 1.0).
 * Grund: `mce_gesamtscore` ist in scorer.py eine gewichtete Summe von 0–100-Teilscores, eine
 * Gewichtssumme über 1.0 könnte also rechnerisch über 100 % hinauslaufen und würde abgeschnitten.
 * Die Summe ist deshalb nicht nur gedeckelt, sondern fix: wird ein Regler erhöht, sinken die
 * übrigen automatisch – und umgekehrt.
 *
 * `w_eigendaten` zählt bewusst nicht mit: eigene Kategorie außerhalb von Bedarf/Bebauung.
 */
export const WEIGHT_BUDGET_STEPS = 10

/** Alle Faktoren, die sich das Budget teilen (Reihenfolge wie in der UI). */
export const BUDGETED_WEIGHT_KEYS = WEIGHT_GROUPS.flatMap((group) => group.weights)

type Weights = Record<string, number | undefined>

/** Summe der Budget-Faktoren in UI-Stufen (kann bei Altdaten von `WEIGHT_BUDGET_STEPS` abweichen). */
export const totalWeightSteps = (weights: Weights | undefined) =>
  BUDGETED_WEIGHT_KEYS.reduce((sum, key) => sum + weightToStep(weights?.[key]), 0)

/** Summe der Stufen einer Faktorgruppe (Bedarf bzw. Bebauung) – für die Gruppenüberschrift. */
export const groupWeightSteps = (weights: Weights | undefined, groupWeightKeys: string[]) =>
  groupWeightKeys.reduce((sum, key) => sum + weightToStep(weights?.[key]), 0)

/**
 * Verteilt `target` Stufen proportional zu `current` und rundet ganzzahlig, sodass die Summe
 * exakt `target` ergibt (Largest-Remainder-Verfahren: erst abrunden, die Restschritte gehen an
 * die größten Nachkommaanteile). Jeder Wert bleibt in [0, WEIGHT_STEPS].
 */
function distributeProportionally(current: number[], target: number) {
  const sum = current.reduce((a, b) => a + b, 0)
  // Ohne verbleibendes Gewicht gibt es kein Verhältnis, an dem man sich orientieren könnte –
  // dann gleichmäßig verteilen, sonst ließe sich das Budget nicht mehr füllen.
  const exact =
    sum > 0
      ? current.map((value) => (value / sum) * target)
      : current.map(() => target / current.length)

  const result = exact.map((value) => Math.min(WEIGHT_STEPS, Math.floor(value)))
  let rest = target - result.reduce((a, b) => a + b, 0)
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)

  for (const { index } of byRemainder) {
    if (rest <= 0) break
    if (result[index]! >= WEIGHT_STEPS) continue
    result[index]! += 1
    rest -= 1
  }
  return result
}

/**
 * Setzt einen Faktor auf `weight` und gleicht die übrigen Budget-Faktoren so an, dass die Summe
 * wieder exakt `WEIGHT_BUDGET_STEPS` ergibt. Die Differenz wird proportional zum aktuellen
 * Gewicht verteilt: wer viel hat, gibt viel ab bzw. bekommt viel dazu. Faktoren auf 0 bleiben
 * dadurch auf 0 („fließt nicht ein“ bleibt bestehen) – außer alle anderen stehen auf 0, dann
 * wird gleichmäßig verteilt.
 *
 * Nicht budgetierte Gewichte (`w_eigendaten`) bleiben unverändert erhalten.
 */
export function applyWeightWithinBudget(
  weights: Weights | undefined,
  changedKey: string,
  weight: number,
): Record<string, number> {
  const changedStep = Math.min(WEIGHT_BUDGET_STEPS, weightToStep(weight))
  if (!BUDGETED_WEIGHT_KEYS.includes(changedKey)) {
    return { ...(weights as Record<string, number>), [changedKey]: stepToWeight(changedStep) }
  }
  const otherKeys = BUDGETED_WEIGHT_KEYS.filter((key) => key !== changedKey)
  const otherSteps = distributeProportionally(
    otherKeys.map((key) => weightToStep(weights?.[key])),
    WEIGHT_BUDGET_STEPS - changedStep,
  )

  const next: Record<string, number> = {}
  for (const [key, value] of Object.entries(weights ?? {})) {
    if (value !== undefined) next[key] = value
  }
  next[changedKey] = stepToWeight(changedStep)
  otherKeys.forEach((key, index) => {
    next[key] = stepToWeight(otherSteps[index]!)
  })
  return next
}
