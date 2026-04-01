import invariant from 'tiny-invariant'
import type { MapDataCategoryConfig } from '../type'
import { decodeBits, iterate } from './lib'

export const parse = (
  searchParam: string,
  // `referenceConfig` is either …
  // - a `freshConfig` (createFreshCategoriesConfig, when parse is used in the "client")
  // - a `simplifiedConfig` from the stored config templates, when parse is used on the server/in the middleware
  referenceConfig: MapDataCategoryConfig[],
) => {
  // Decode `active:true|false` values
  const base36 = searchParam.split('.').slice(1)
  const uint32s = base36.map((s) => Number.parseInt(s, 36))
  const actives = decodeBits(uint32s)

  // Apply `active` values to the `config`
  const config = structuredClone(referenceConfig)
  let i = 0
  iterate(config, (obj) => {
    const idx = i++
    const active = actives[idx]
    invariant(
      active !== undefined,
      `parse: active value missing at index ${idx} (actives.length=${actives.length}, searchParam="${searchParam}")`,
    )
    obj.active = active
  })
  return config
}
