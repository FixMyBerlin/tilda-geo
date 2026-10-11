import { describe, expect, test } from 'vitest'
import type { QaEvaluationForArea } from '@/server/qa-configs/queries/getQaDecisionDataForArea.server'
import { groupQaThread } from './groupQaThread'

const evaluation = (values: Partial<QaEvaluationForArea>) =>
  ({
    id: 1,
    createdAt: new Date('2026-10-01T10:00:00Z'),
    evaluatorType: 'USER',
    author: { id: 'u7' },
    body: 'Baustelle',
    ...values,
  }) as QaEvaluationForArea

const indicator = (key: string, history: QaEvaluationForArea[]) => ({
  key,
  label: key,
  unit: 'm' as const,
  unitSuffix: 'm' as const,
  inspectorSourceId: 'atlas_bikelanes' as const,
  history,
})

describe('groupQaThread', () => {
  test('one save on two attributes is one entry, the nightly run before it another', () => {
    const save = new Date('2026-10-02T09:00:00Z')
    const entries = groupQaThread([
      indicator('category', [
        evaluation({ id: 3, createdAt: save }),
        evaluation({ id: 1, evaluatorType: 'SYSTEM', author: null, body: null }),
      ]),
      indicator('oneway', [
        evaluation({ id: 4, createdAt: save }),
        evaluation({ id: 2, evaluatorType: 'SYSTEM', author: null, body: null }),
      ]),
    ])

    expect(entries.map((entry) => entry.items.map((item) => item.evaluation.id))).toEqual([
      [3, 4],
      [1, 2],
    ])
  })

  test('two decisions on the same attribute stay two entries', () => {
    const entries = groupQaThread([
      indicator('category', [evaluation({ id: 2 }), evaluation({ id: 1 })]),
    ])

    expect(entries).toHaveLength(2)
  })

  test('another comment or another author is another entry', () => {
    const entries = groupQaThread([
      indicator('category', [evaluation({ id: 1 })]),
      indicator('oneway', [evaluation({ id: 2, body: 'Referenz falsch' })]),
      indicator('surface', [evaluation({ id: 3, author: { id: 'u8' } as never })]),
    ])

    expect(entries).toHaveLength(3)
  })
})
