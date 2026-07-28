/** Linear interpolate Mapbox `['interpolate', ['linear'], ['zoom'], z0, v0, z1, v1, ...]` at a fixed zoom. */
export const interpolateZoom = (stops: number[], zoom: number) => {
  if (stops.length < 4 || stops.length % 2 !== 0) {
    throw new Error(`Invalid interpolate stops: ${JSON.stringify(stops)}`)
  }

  const pairs: Array<[number, number]> = []
  for (let i = 0; i < stops.length; i += 2) {
    const z = stops[i]
    const v = stops[i + 1]
    if (z === undefined || v === undefined) {
      throw new Error(`Invalid interpolate stops: ${JSON.stringify(stops)}`)
    }
    pairs.push([z, v])
  }

  const first = pairs[0]
  if (!first) {
    throw new Error(`Invalid interpolate stops: ${JSON.stringify(stops)}`)
  }
  if (zoom <= first[0]) return first[1]

  const last = pairs[pairs.length - 1]
  if (!last) {
    throw new Error(`Invalid interpolate stops: ${JSON.stringify(stops)}`)
  }
  if (zoom >= last[0]) return last[1]

  for (let i = 0; i < pairs.length - 1; i++) {
    const current = pairs[i]
    const next = pairs[i + 1]
    if (!current || !next) continue

    const [z0, v0] = current
    const [z1, v1] = next
    if (zoom >= z0 && zoom <= z1) {
      const t = (zoom - z0) / (z1 - z0)
      return v0 + (v1 - v0) * t
    }
  }

  return last[1]
}
