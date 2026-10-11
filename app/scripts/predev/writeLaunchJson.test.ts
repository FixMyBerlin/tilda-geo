import { describe, expect, test } from 'vitest'
import { portsFromSlot } from './devPortSlot'
import { buildLaunchJson } from './writeLaunchJson'

describe('buildLaunchJson()', () => {
  test('follows the port slot', () => {
    const [configuration] = buildLaunchJson(portsFromSlot(2).vitePort).configurations
    expect(configuration?.port).toBe(5175)
    expect(configuration?.url).toBe('http://127.0.0.1:5175')
  })

  test('loads .env.local so the dev server picks up the same slot and stack', () => {
    const [configuration] = buildLaunchJson(5174).configurations
    expect(configuration?.runtimeArgs).toContain('--env-file=../.env.local')
  })
})
