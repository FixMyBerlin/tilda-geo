import { describe, expect, test, vi } from 'vitest'
import {
  applyDevPortSlotToProcessEnv,
  devPortSlotErrorMessage,
  exitOnInvalidDevPortSlot,
  findFirstFreeDevPortSlot,
  parseDevPortSlot,
  portsFromSlot,
  type DevPortSlotConfig,
} from './devPortSlot'

describe('parseDevPortSlot', () => {
  test('treats absent or 0 as default mode', () => {
    expect(parseDevPortSlot(undefined)).toBe(0)
    expect(parseDevPortSlot('')).toBe(0)
    expect(parseDevPortSlot('0')).toBe(0)
  })

  test('accepts slots 1..5', () => {
    for (let slot = 1; slot <= 5; slot++) {
      expect(parseDevPortSlot(String(slot))).toBe(slot)
    }
  })

  test('rejects invalid slots', () => {
    expect(() => parseDevPortSlot('-1')).toThrow(/DEV_PORT_SLOT/)
    expect(() => parseDevPortSlot('6')).toThrow(/DEV_PORT_SLOT/)
    expect(() => parseDevPortSlot('1.5')).toThrow(/DEV_PORT_SLOT/)
    expect(() => parseDevPortSlot('foo')).toThrow(/DEV_PORT_SLOT/)
  })
})

describe('devPortSlotErrorMessage', () => {
  test('returns undefined for valid or default values', () => {
    expect(devPortSlotErrorMessage(undefined)).toBeUndefined()
    expect(devPortSlotErrorMessage('0')).toBeUndefined()
    expect(devPortSlotErrorMessage('3')).toBeUndefined()
  })

  test('returns message for invalid values', () => {
    expect(devPortSlotErrorMessage('foo')).toMatch(/DEV_PORT_SLOT/)
    expect(devPortSlotErrorMessage('6')).toMatch(/DEV_PORT_SLOT/)
  })
})

describe('exitOnInvalidDevPortSlot', () => {
  test('exits with code 1 on invalid slot', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    exitOnInvalidDevPortSlot('test_label', { DEV_PORT_SLOT: '99' } as unknown as NodeJS.ProcessEnv)
    expect(exit).toHaveBeenCalledWith(1)
    exit.mockRestore()
  })

  test('does not exit on valid slot', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    exitOnInvalidDevPortSlot('test_label', { DEV_PORT_SLOT: '2' } as unknown as NodeJS.ProcessEnv)
    expect(exit).not.toHaveBeenCalled()
    exit.mockRestore()
  })
})

describe('applyDevPortSlotToProcessEnv', () => {
  test('slot 0 is a no-op and does not mutate env', () => {
    const env = { DEV_PORT_SLOT: '0' } as unknown as NodeJS.ProcessEnv
    const config = applyDevPortSlotToProcessEnv(env)
    expect(config.slot).toBe(0)
    expect(env.DATABASE_PORT).toBeUndefined()
    expect(env.TILES_PORT).toBeUndefined()
    expect(env.VITE_TILES_PORT).toBeUndefined()
    expect(env.DEV_VITE_PORT).toBeUndefined()
    expect(env.VITE_APP_ORIGIN).toBeUndefined()
  })

  test('slot > 0 sets derived port env keys', () => {
    const env = { DEV_PORT_SLOT: '2' } as unknown as NodeJS.ProcessEnv
    const config = applyDevPortSlotToProcessEnv(env)
    expect(config.slot).toBe(2)
    expect(env.DATABASE_PORT).toBe('5434')
    expect(env.TILES_PORT).toBe('3002')
    expect(env.VITE_APP_ORIGIN).toBe('http://127.0.0.1:5175')
  })
})

describe('portsFromSlot', () => {
  test('default slot uses fixed ports', () => {
    expect(portsFromSlot(0)).toEqual({
      slot: 0,
      databasePort: 5432,
      tilesPort: 3000,
      vitePort: 5173,
      appOrigin: 'http://127.0.0.1:5173',
    } satisfies DevPortSlotConfig)
  })

  test('slot 1 offsets db, tiles, and vite', () => {
    expect(portsFromSlot(1)).toEqual({
      slot: 1,
      databasePort: 5433,
      tilesPort: 3001,
      vitePort: 5174,
      appOrigin: 'http://127.0.0.1:5174',
    } satisfies DevPortSlotConfig)
  })

  test('slot 5 uses highest offset', () => {
    expect(portsFromSlot(5)).toEqual({
      slot: 5,
      databasePort: 5437,
      tilesPort: 3005,
      vitePort: 5178,
      appOrigin: 'http://127.0.0.1:5178',
    } satisfies DevPortSlotConfig)
  })
})

describe('findFirstFreeDevPortSlot', () => {
  test('returns first slot where db, tiles, and vite are free', async () => {
    const busy = new Set([5433, 3001, 5174, 5434, 3002, 5175])
    const slot = await findFirstFreeDevPortSlot(async (port) => !busy.has(port))
    expect(slot).toBe(3)
  })

  test('returns undefined when no slot is fully free', async () => {
    const slot = await findFirstFreeDevPortSlot(async () => false)
    expect(slot).toBeUndefined()
  })

  test('skips partially busy slots', async () => {
    const busy = new Set([5433])
    const slot = await findFirstFreeDevPortSlot(async (port) => !busy.has(port))
    expect(slot).toBe(2)
  })
})
