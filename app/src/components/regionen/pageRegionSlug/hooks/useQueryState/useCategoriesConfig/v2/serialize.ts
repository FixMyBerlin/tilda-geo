import type { MapDataCategoryConfig } from '../type'
import { calcConfigChecksum, encodeBits, iterate } from './lib'

export const serialize = (config: MapDataCategoryConfig[]) => {
  // Part 1: The config template
  const checksum = calcConfigChecksum(config)

  // Part 2: Encoded `true|false` values
  const actives: boolean[] = []
  iterate(config, (obj) => actives.push(obj.active))
  const encoded = encodeBits(actives)
  const base36 = encoded.map((v) => v.toString(36))

  return [checksum, ...base36].join('.')
}
