import { beforeEach, describe, expect, test } from 'vitest'
import {
  type SpaceFinderCandidate,
  useSpaceFinderCandidatesState,
} from './useSpaceFinderCandidatesState'

const candidate = (h3Id: string): SpaceFinderCandidate => ({
  h3Id,
  geometry: { type: 'Point', coordinates: [13.4, 52.5] },
  properties: { mce_gesamtscore: 80 },
})

const ids = (runId: number) =>
  (useSpaceFinderCandidatesState.getState().candidatesByRun[runId] ?? []).map((c) => c.h3Id)

describe('useSpaceFinderCandidatesState', () => {
  beforeEach(() => {
    useSpaceFinderCandidatesState.setState({ selectActive: false, candidatesByRun: {} })
  })

  test('toggleCandidate adds in selection order and removes on second toggle', () => {
    const { toggleCandidate } = useSpaceFinderCandidatesState.getState()
    toggleCandidate(1, candidate('a'))
    toggleCandidate(1, candidate('b'))
    expect(ids(1)).toEqual(['a', 'b'])

    toggleCandidate(1, candidate('a'))
    expect(ids(1)).toEqual(['b'])
  })

  test('selections of different runs stay separate', () => {
    const { toggleCandidate, removeCandidate, clearCandidates } =
      useSpaceFinderCandidatesState.getState()
    toggleCandidate(1, candidate('a'))
    toggleCandidate(2, candidate('a'))
    toggleCandidate(2, candidate('b'))

    removeCandidate(2, 'a')
    expect(ids(1)).toEqual(['a'])
    expect(ids(2)).toEqual(['b'])

    clearCandidates(1)
    expect(ids(1)).toEqual([])
    expect(ids(2)).toEqual(['b'])
  })
})
