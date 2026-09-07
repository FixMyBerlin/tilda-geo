import { describe, expect, test } from 'vitest'
import { DEFAULT_GROUP, flattenGroups, GROUPS, initGroups } from './layerOrderGroups'

const ANCHOR_TOP = 'atlas-app-beforeid-top'
const ANCHOR_ROADNAME = 'atlas-app-beforeid-below-roadname'

const codeKeys = ['alpha', 'bravo', 'charlie', 'delta']
const codeKeySet = new Set(codeKeys)

describe('initGroups', () => {
  test('empty DB puts all code keys in default, in code order', () => {
    const groups = initGroups([], codeKeys)
    expect(groups[DEFAULT_GROUP]).toEqual(codeKeys)
    for (const group of GROUPS) {
      if (group === DEFAULT_GROUP) continue
      expect(groups[group], group).toEqual([])
    }
  })

  test('valid anchors land in that group in DB order; stale keys stay; missing code keys append to default', () => {
    const groups = initGroups(
      [
        { layerKey: 'bravo', beforeId: ANCHOR_TOP },
        { layerKey: 'stale-gone', beforeId: ANCHOR_ROADNAME },
        { layerKey: 'alpha', beforeId: ANCHOR_TOP },
      ],
      codeKeys,
    )
    expect(groups[ANCHOR_TOP]).toEqual(['bravo', 'alpha'])
    expect(groups[ANCHOR_ROADNAME]).toEqual(['stale-gone'])
    expect(groups[DEFAULT_GROUP]).toEqual(['charlie', 'delta'])
  })

  test('unknown or null beforeId lands in default', () => {
    const groups = initGroups(
      [
        { layerKey: 'alpha', beforeId: 'housenumber' },
        { layerKey: 'bravo', beforeId: null },
      ],
      codeKeys,
    )
    expect(groups[DEFAULT_GROUP]).toEqual(['alpha', 'bravo', 'charlie', 'delta'])
    expect(groups[ANCHOR_TOP]).toEqual([])
  })
})

describe('flattenGroups', () => {
  test('drops stale keys, maps default to null and anchors to their id, index is position', () => {
    const groups = initGroups(
      [
        { layerKey: 'stale-gone', beforeId: ANCHOR_ROADNAME },
        { layerKey: 'bravo', beforeId: ANCHOR_TOP },
        { layerKey: 'alpha', beforeId: null },
      ],
      codeKeys,
    )
    const entries = flattenGroups(groups, codeKeySet)
    expect(entries).toEqual([
      { layerKey: 'alpha', beforeId: null },
      { layerKey: 'charlie', beforeId: null },
      { layerKey: 'delta', beforeId: null },
      { layerKey: 'bravo', beforeId: ANCHOR_TOP },
    ])
    expect(entries.map((e) => e.layerKey)).not.toContain('stale-gone')
  })

  test('round trip preserves {layerKey, beforeId} set and within-group order', () => {
    const db = [
      { layerKey: 'charlie', beforeId: null },
      { layerKey: 'alpha', beforeId: ANCHOR_ROADNAME },
      { layerKey: 'delta', beforeId: ANCHOR_ROADNAME },
      { layerKey: 'bravo', beforeId: ANCHOR_TOP },
    ]
    const flattened = flattenGroups(initGroups(db, codeKeys), codeKeySet)
    expect(new Set(flattened.map((e) => `${e.layerKey}:${e.beforeId}`))).toEqual(
      new Set(db.map((e) => `${e.layerKey}:${e.beforeId}`)),
    )
    expect(flattened.filter((e) => e.beforeId === ANCHOR_ROADNAME).map((e) => e.layerKey)).toEqual([
      'alpha',
      'delta',
    ])
    expect(flattened.filter((e) => e.beforeId === ANCHOR_TOP).map((e) => e.layerKey)).toEqual([
      'bravo',
    ])
    expect(flattened.filter((e) => e.beforeId === null).map((e) => e.layerKey)).toEqual(['charlie'])
  })
})
