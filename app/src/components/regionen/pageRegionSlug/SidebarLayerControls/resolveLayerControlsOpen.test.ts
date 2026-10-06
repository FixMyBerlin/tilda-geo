import { describe, expect, test } from 'vitest'
import { layerControlsOpenByDefault, resolveLayerControlsOpen } from './resolveLayerControlsOpen'

describe('layerControlsOpenByDefault', () => {
  test('Karte is open; other modes are closed', () => {
    expect(layerControlsOpenByDefault('map')).toBe(true)
    expect(layerControlsOpenByDefault('notes')).toBe(false)
    expect(layerControlsOpenByDefault('qa')).toBe(false)
    expect(layerControlsOpenByDefault('reviewLists')).toBe(false)
  })
})

describe('resolveLayerControlsOpen', () => {
  test('uses mode defaults when the user has not decided', () => {
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode: {},
        layoutForcedClosedMode: null,
      }),
    ).toBe(true)
    expect(
      resolveLayerControlsOpen({
        mode: 'notes',
        userOpenByMode: {},
        layoutForcedClosedMode: null,
      }),
    ).toBe(false)
    expect(
      resolveLayerControlsOpen({
        mode: 'qa',
        userOpenByMode: {},
        layoutForcedClosedMode: null,
      }),
    ).toBe(false)
    expect(
      resolveLayerControlsOpen({
        mode: 'reviewLists',
        userOpenByMode: {},
        layoutForcedClosedMode: null,
      }),
    ).toBe(false)
  })

  test('remembers a user close on Karte and a user open on Hinweise', () => {
    const userOpenByMode = { map: false, notes: true }
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode,
        layoutForcedClosedMode: null,
      }),
    ).toBe(false)
    expect(
      resolveLayerControlsOpen({
        mode: 'notes',
        userOpenByMode,
        layoutForcedClosedMode: null,
      }),
    ).toBe(true)
    // Modes without a decision still use defaults.
    expect(
      resolveLayerControlsOpen({
        mode: 'qa',
        userOpenByMode,
        layoutForcedClosedMode: null,
      }),
    ).toBe(false)
  })

  test('layout auto-fold closes only the mode where the panel was dragged', () => {
    expect(
      resolveLayerControlsOpen({
        mode: 'notes',
        userOpenByMode: { notes: true },
        layoutForcedClosedMode: 'notes',
      }),
    ).toBe(false)
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode: {},
        layoutForcedClosedMode: 'notes',
      }),
    ).toBe(true)
  })

  test('layout auto-fold closes the sheet without needing a user decision', () => {
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode: {},
        layoutForcedClosedMode: 'map',
      }),
    ).toBe(false)
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode: { map: true },
        layoutForcedClosedMode: 'map',
      }),
    ).toBe(false)
  })

  test('after layout fold is cleared, user decision or default applies again', () => {
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode: {},
        layoutForcedClosedMode: null,
      }),
    ).toBe(true)
    expect(
      resolveLayerControlsOpen({
        mode: 'map',
        userOpenByMode: { map: false },
        layoutForcedClosedMode: null,
      }),
    ).toBe(false)
  })
})
