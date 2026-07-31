import adler32 from 'adler-32'
import type { FeatureCollection } from 'geojson'

export const addUniqueIds = <G extends FeatureCollection>(data: G) => {
  const one = new Uint32Array(1)
  for (const f of data.features) {
    one[0] = adler32.str(JSON.stringify(f))
    f.id = one[0]
  }
  return data
}
