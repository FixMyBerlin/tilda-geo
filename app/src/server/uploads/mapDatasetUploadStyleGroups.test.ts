import { describe, expect, test } from 'vitest'
import { styleGroupProblems } from './mapDatasetUploadStyleGroups'

const group = { id: 'datensatz-b', name: 'Datensatz B' }
const config = (name: string, styleGroup?: string, categoryKey = 'infravelo/ergebnisse') => ({
  name,
  subId: name.toLowerCase(),
  styleGroup,
  categoryKey,
})

describe('styleGroupProblems', () => {
  test('accepts a group with two configs and ungrouped configs', () => {
    expect(
      styleGroupProblems(
        [group],
        [config('Standard', 'datensatz-b'), config('OFM', 'datensatz-b'), config('Andere')],
      ),
    ).toEqual([])
  })

  test('reports unknown groups, small groups, mixed categories and duplicate ids', () => {
    expect(
      styleGroupProblems(
        [group, group],
        [config('Standard', 'datensatz-b'), config('OFM', 'datensatz-b', 'x'), config('C', 'c')],
      ),
    ).toEqual([
      'styleGroups: id "datensatz-b" is used more than once',
      'config "C": styleGroup "c" is missing in styleGroups',
      'styleGroup "datensatz-b": all its configs need the same categoryKey',
    ])
    expect(styleGroupProblems([group], [config('Standard', 'datensatz-b')])).toEqual([
      'styleGroup "datensatz-b" needs at least two configs, has 1',
    ])
  })

  test('reports styles of one group that share a subId', () => {
    expect(
      styleGroupProblems(
        [group],
        [config('Standard', 'datensatz-b'), config('OFM', 'datensatz-b')].map((entry) => ({
          ...entry,
          subId: undefined,
        })),
      ),
    ).toEqual(['styleGroup "datensatz-b": each config needs its own subId (one may omit it)'])
  })
})
