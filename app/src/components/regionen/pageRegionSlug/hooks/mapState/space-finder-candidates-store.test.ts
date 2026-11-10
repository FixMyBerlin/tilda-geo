import { beforeEach, describe, expect, test } from 'vitest'
import {
  type SpaceFinderCandidate,
  candidateRunKey,
  getSpaceFinderCandidatesSnapshot,
  resetSpaceFinderCandidatesState,
} from './space-finder-candidates-store'

const candidate = (h3Id: string): SpaceFinderCandidate => ({
  h3Id,
  geometry: { type: 'Point', coordinates: [13.4, 52.5] },
  properties: { mce_gesamtscore: 80 },
})

const RUN_1 = candidateRunKey({ id: 1, createdAt: '2026-10-13T10:00:00.000Z' })
const RUN_2 = candidateRunKey({ id: 2, createdAt: '2026-10-13T11:00:00.000Z' })

const ids = (runKey: string) =>
  (getSpaceFinderCandidatesSnapshot().candidatesByRun[runKey] ?? []).map((c) => c.h3Id)

describe('candidateRunKey', () => {
  test('tells apart runs with the same id from different databases', () => {
    const fromDevelop = candidateRunKey({ id: 11, createdAt: '2026-09-01T08:00:00.000Z' })
    const fromWorktree = candidateRunKey({ id: 11, createdAt: new Date('2026-10-13T13:00:00Z') })
    expect(fromDevelop).not.toBe(fromWorktree)
  })

  test('is the same for a Date and its ISO string', () => {
    const date = new Date('2026-10-13T13:00:00Z')
    expect(candidateRunKey({ id: 3, createdAt: date })).toBe(
      candidateRunKey({ id: 3, createdAt: date.toISOString() }),
    )
  })
})

describe('space-finder-candidates-store', () => {
  beforeEach(() => {
    resetSpaceFinderCandidatesState()
  })

  test('toggleCandidate adds in selection order and removes on second toggle', () => {
    const { toggleCandidate } = getSpaceFinderCandidatesSnapshot().actions
    expect(toggleCandidate(RUN_1, candidate('a'))).toBe(true)
    expect(toggleCandidate(RUN_1, candidate('b'))).toBe(true)
    expect(ids(RUN_1)).toEqual(['a', 'b'])

    expect(toggleCandidate(RUN_1, candidate('a'))).toBe(false)
    expect(ids(RUN_1)).toEqual(['b'])
  })

  test('setCandidateGeometry replaces only the geometry of that candidate', () => {
    const { toggleCandidate, setCandidateGeometry } = getSpaceFinderCandidatesSnapshot().actions
    toggleCandidate(RUN_1, candidate('a'))
    toggleCandidate(RUN_1, candidate('b'))
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
    setCandidateGeometry(RUN_1, 'a', full)

    const [a, b] = getSpaceFinderCandidatesSnapshot().candidatesByRun[RUN_1] ?? []
    expect(a?.geometry).toEqual(full)
    expect(a?.properties).toEqual({ mce_gesamtscore: 80 })
    expect(b?.geometry).toEqual(candidate('b').geometry)
  })

  test('selections of different runs stay separate', () => {
    const { toggleCandidate, removeCandidate, clearCandidates } =
      getSpaceFinderCandidatesSnapshot().actions
    toggleCandidate(RUN_1, candidate('a'))
    toggleCandidate(RUN_2, candidate('a'))
    toggleCandidate(RUN_2, candidate('b'))

    removeCandidate(RUN_2, 'a')
    expect(ids(RUN_1)).toEqual(['a'])
    expect(ids(RUN_2)).toEqual(['b'])

    clearCandidates(RUN_1)
    expect(ids(RUN_1)).toEqual([])
    expect(ids(RUN_2)).toEqual(['b'])
  })
})
