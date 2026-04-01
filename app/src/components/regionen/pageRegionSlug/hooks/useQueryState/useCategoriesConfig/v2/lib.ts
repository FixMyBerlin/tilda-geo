import adler32 from 'adler-32'
import { staticRegion } from '@/data/regions.const'
import { createFreshCategoriesConfig } from '../createFreshCategoriesConfig'
import type { MapDataCategoryConfig } from '../type'
import { simplifyConfigForParams } from '../utils/simplifyConfigForParams'

function isObject(value: unknown): value is object {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

// recursively iterates over a nested data structure of objects and arrays
// and calls fn(obj, path) for every object with properties 'id' and 'active'
type Obj = Record<string, unknown> & { id: string; active: boolean }
type Fn = (obj: Obj, path: (string | number)[]) => void
export function iterate(obj: unknown, fn: Fn, path?) {
  if (!path) path = []
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      iterate(v, fn, [...path, i])
    })
  } else if (isObject(obj)) {
    if ('id' in obj && 'active' in obj) {
      fn(obj as Obj, path)
    }
    Object.entries(obj).forEach(([k, v]) => {
      iterate(v, fn, [...path, k])
    })
  }
}

export function setAllActiveToFalse<T>(config: T) {
  const allActiveFalse = structuredClone(config)
  iterate(allActiveFalse, (obj) => {
    obj.active = false
  })
  return allActiveFalse
}

export function calcConfigChecksum(config: MapDataCategoryConfig[]) {
  const simplified = simplifyConfigForParams(config)
  const allFalse = setAllActiveToFalse(simplified)
  const n = new Uint32Array([adler32.str(JSON.stringify(allFalse))])[0]
  return n === undefined ? '' : n.toString(36)
}

const useBits = 31 // unsigned

export function encodeBits(booleans: boolean[]) {
  const numIntegers = Math.ceil(booleans.length / useBits)
  const integers = new Array(numIntegers)
  for (let b = 0; b < booleans.length; b++) {
    const i = Math.floor(b / useBits)
    const bit = b % useBits
    integers[i] = integers[i] | (Number(booleans[b]) << bit)
  }
  return integers
}

export function decodeBits(integers: number[]) {
  const booleans: boolean[] = new Array(integers.length * useBits)
  for (let i = 0; i < integers.length; i++) {
    let int = integers[i] ?? 0
    for (let bit = 0; bit < useBits; bit++) {
      booleans[i * useBits + bit] = !!(int & 1)
      int >>= 1
    }
  }
  return booleans
}

export function getSimplifiedConfigs() {
  type Result = Map<
    string,
    { config: ReturnType<typeof simplifyConfigForParams>; regionSlugs: string[] }
  >
  const result: Result = new Map([])
  for (const region of staticRegion) {
    const freshConfig = createFreshCategoriesConfig(region.categories)
    const checksum = calcConfigChecksum(freshConfig)
    const simplifiedConfig = simplifyConfigForParams(freshConfig)
    const existing = result.get(checksum)?.regionSlugs ?? []
    result.set(checksum, {
      config: simplifiedConfig,
      regionSlugs: [...existing, region.slug].sort((a, b) => a.localeCompare(b)),
    })
  }
  return result
}
