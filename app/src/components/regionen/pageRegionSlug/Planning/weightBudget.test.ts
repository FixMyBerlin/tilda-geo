import { describe, expect, it } from 'vitest'
import { DEFAULT_FACTOR_TEMPLATE } from './planningDefaults'
import {
  applyWeightWithinBudget,
  BUDGETED_WEIGHT_KEYS,
  totalWeightSteps,
  WEIGHT_BUDGET_STEPS,
} from './weightBudget'

// `FactorConfig` ist ein passthrough-Schema, `weights` daher `unknown` — für die Tests einmal
// zentral auf den tatsächlichen Typ festgelegt.
const DEFAULT_WEIGHTS = DEFAULT_FACTOR_TEMPLATE.weights as Record<string, number>

const steps = (weights: Record<string, number>) =>
  Object.fromEntries(BUDGETED_WEIGHT_KEYS.map((key) => [key, Math.round(weights[key]! * 10)]))

describe('applyWeightWithinBudget', () => {
  it('hält die Summe der Default-Gewichte beim Budget', () => {
    expect(totalWeightSteps(DEFAULT_WEIGHTS)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('senkt die übrigen Faktoren, wenn einer erhöht wird', () => {
    const next = applyWeightWithinBudget(DEFAULT_WEIGHTS, 'w_cyclepath', 0.6)
    expect(steps(next).w_cyclepath).toBe(6)
    expect(totalWeightSteps(next)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('hebt die übrigen Faktoren, wenn einer gesenkt wird', () => {
    const next = applyWeightWithinBudget(DEFAULT_WEIGHTS, 'w_cyclepath', 0)
    expect(steps(next).w_cyclepath).toBe(0)
    expect(totalWeightSteps(next)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('lässt Faktoren auf 0 auf 0 (verteilt proportional zum bestehenden Gewicht)', () => {
    const next = applyWeightWithinBudget(DEFAULT_WEIGHTS, 'w_cyclepath', 0.1)
    expect(steps(next).w_vegetation).toBe(0)
    expect(steps(next).w_bestand).toBe(0)
    expect(totalWeightSteps(next)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('füllt das Budget gleichmäßig, wenn sonst kein Faktor Gewicht hat', () => {
    const single = { w_cyclepath: 1 }
    const next = applyWeightWithinBudget(single, 'w_cyclepath', 0.2)
    expect(steps(next).w_cyclepath).toBe(2)
    expect(totalWeightSteps(next)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('normalisiert Altdaten über Budget bei der ersten Änderung', () => {
    const legacy = {
      w_cyclepath: 0.2,
      w_surface: 0.2,
      w_target: 0.2,
      w_slope: 0.2,
      w_transit: 0.2,
      w_intersection: 0.1,
      w_parken: 0.1,
      w_fussgaengerzone: 0.2,
    }
    expect(totalWeightSteps(legacy)).toBe(14)
    const next = applyWeightWithinBudget(legacy, 'w_slope', 0.2)
    expect(steps(next).w_slope).toBe(2)
    expect(totalWeightSteps(next)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('lässt das nicht budgetierte Eigendaten-Gewicht unberührt', () => {
    const withUserData = { ...DEFAULT_WEIGHTS, w_eigendaten: 0.5 }
    const next = applyWeightWithinBudget(withUserData, 'w_cyclepath', 0.4)
    expect(next.w_eigendaten).toBe(0.5)
    expect(totalWeightSteps(next)).toBe(WEIGHT_BUDGET_STEPS)
  })

  it('verändert bei einer Änderung von w_eigendaten die Budget-Faktoren nicht', () => {
    const next = applyWeightWithinBudget(DEFAULT_WEIGHTS, 'w_eigendaten', 0.7)
    expect(next.w_eigendaten).toBe(0.7)
    expect(steps(next)).toEqual(steps(DEFAULT_WEIGHTS))
  })
})
