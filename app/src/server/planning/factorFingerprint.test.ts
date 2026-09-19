import { describe, expect, it } from 'vitest'
import {
  areaInputsDiffer,
  comparableRunSnapshot,
  factorsDiffer,
  outdatedBannerReason,
} from './factorFingerprint'
import { mergeFactorConfig, type PlanningAreaInput } from './mergeFactorConfig'

const area = (overrides: Partial<PlanningAreaInput> = {}): PlanningAreaInput => ({
  studyArea: { type: 'Polygon', coordinates: [] },
  useCase: 'fahrradbox',
  areaSizeM2: null,
  ...overrides,
})

describe('comparableRunSnapshot', () => {
  it('stellt einen Auto-Alt-Snapshot ohne Schwellen-Key der gemergten Config gleich', () => {
    const input = area({ censusSaettigungEw: 22, censusEwPerHa: 100 })
    const current = mergeFactorConfig(input, { weights: { w_cyclepath: 0.2 } })
    const oldSnapshot = { weights: { w_cyclepath: 0.2 } }
    expect(factorsDiffer(current, comparableRunSnapshot(oldSnapshot, input))).toBe(false)
  })

  it('erkennt einen von Hand gesetzten Wert gegen einen Snapshot mit Zensus-Vorschlag', () => {
    const input = area({ censusSaettigungEw: 22 })
    const current = mergeFactorConfig(input, { bewohnerbedarf_saettigung_ew: 45 })
    const snapshot = mergeFactorConfig(input, {})
    expect(factorsDiffer(current, comparableRunSnapshot(snapshot, input))).toBe(true)
  })

  it('stellt einen neuen Auto-Snapshot (Schwelle eingefroren) der aktuellen Config gleich', () => {
    const input = area({ censusSaettigungEw: 22 })
    const current = mergeFactorConfig(input, {})
    expect(factorsDiffer(current, comparableRunSnapshot(current, input))).toBe(false)
  })
})

describe('areaInputsDiffer', () => {
  it('ist false bei gleichem Gebiet, auch wenn Faktoren abweichen', () => {
    const input = area({ censusSaettigungEw: 22 })
    const snapshot = mergeFactorConfig(input, { weights: { w_cyclepath: 0.2 } })
    const current = mergeFactorConfig(input, { weights: { w_cyclepath: 0.8 } })
    expect(areaInputsDiffer(current, snapshot)).toBe(false)
    expect(factorsDiffer(current, snapshot)).toBe(true)
  })

  it('erkennt eine geänderte Nutzung unabhängig von den Faktoren', () => {
    const snapshot = mergeFactorConfig(area({ useCase: 'fahrradbox' }), {})
    const current = mergeFactorConfig(area({ useCase: 'mobilitaetsstation' }), {})
    expect(areaInputsDiffer(current, snapshot)).toBe(true)
    expect(factorsDiffer(current, snapshot)).toBe(false)
  })

  it('erkennt eine geänderte Geometrie', () => {
    const snapshot = mergeFactorConfig(area(), {})
    const current = mergeFactorConfig(
      area({
        studyArea: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      }),
      {},
    )
    expect(areaInputsDiffer(current, snapshot)).toBe(true)
  })
})

describe('outdatedBannerReason', () => {
  it('nennt beide Ursachen, wenn Gebiet und Faktoren veraltet sind', () => {
    expect(outdatedBannerReason(true, true)).toBe('Faktoren geändert und Planungsgebiet geändert')
  })

  it('nennt nur die zutreffende Ursache', () => {
    expect(outdatedBannerReason(true, false)).toBe('Faktoren geändert')
    expect(outdatedBannerReason(false, true)).toBe('Planungsgebiet geändert')
    expect(outdatedBannerReason(false, false)).toBeNull()
  })
})
