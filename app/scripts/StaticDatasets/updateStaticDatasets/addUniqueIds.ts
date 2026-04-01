import adler32 from 'adler-32'

type FeatureWithId = { id: number | string }

const _areIdsUnique = (features: FeatureWithId[]) => {
  const ids = new Set<number | string>()
  for (const feature of features) {
    if (ids.has(feature.id)) {
      return false // Duplicate ID found
    }
    ids.add(feature.id)
  }
  return true // All IDs are unique
}

// TODO this is broken for now. The check works, but the ID does not whow up. Maybe the issue is, that the feature ID needs to be a number for most cases of maplibre (in one case they can be a string as well)?
export const addUniqueIds = (data: { features: FeatureWithId[] }) => {
  console.log(`  Adding unique id|s of type number...`)
  const one = new Uint32Array(1)
  for (const f of data.features) {
    one[0] = adler32.str(JSON.stringify(f))
    f.id = one[0]
  }
  return data
}
