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
    expect(toggleCandidate(1, candidate('a'))).toBe(true)
    expect(toggleCandidate(1, candidate('b'))).toBe(true)
    expect(ids(1)).toEqual(['a', 'b'])

    expect(toggleCandidate(1, candidate('a'))).toBe(false)
    expect(ids(1)).toEqual(['b'])
  })

  test('setCandidateGeometry replaces only the geometry of that candidate', () => {
    const { toggleCandidate, setCandidateGeometry } = useSpaceFinderCandidatesState.getState()
    toggleCandidate(1, candidate('a'))
    toggleCandidate(1, candidate('b'))
    const full: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [13.4, 52.5],
          [13.5, 52.5],
          [13.5, 52.6],
          [13.4, 52.5],
        ],
      ],
    }
    setCandidateGeometry(1, 'a', full)

    const [a, b] = useSpaceFinderCandidatesState.getState().candidatesByRun[1] ?? []
    expect(a?.geometry).toEqual(full)
    expect(a?.properties).toEqual({ mce_gesamtscore: 80 })
    expect(b?.geometry).toEqual(candidate('b').geometry)
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
