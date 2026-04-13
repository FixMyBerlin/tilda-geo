// See https://github.com/maplibre/maplibre-style-spec/blob/main/build/generate-style-spec.ts#L192
import type { FilterSpecification } from 'maplibre-gl'

/** @desc Private method, exported only for testing */

export const _flattenFilter = (filterArray: unknown[] | FilterSpecification | undefined) => {
  if (!Array.isArray(filterArray)) {
    // NOTE: We later added the types `FilterSpecification` which include `boolean`. This guard will transofrm the boolean input to an empty array. This might not be right…
    return []
  }

  const result: unknown[] = []
  for (const item of filterArray as unknown[]) {
    if (Array.isArray(item) && typeof item[0] === 'string' && item[0] !== 'all') {
      // If item is an array and its first element is a string which is not "all", add it to the result
      result.push(item)
    } else {
      // Recursively process item and add the results to the result
      result.push(..._flattenFilter(item as unknown[] | FilterSpecification | undefined))
    }
  }

  return result
}

export const wrapFilterWithAll = (filterArray: unknown[] | FilterSpecification | undefined) => {
  // Case: Filter expression is passed directly, no wrapping array
  if (
    Array.isArray(filterArray) &&
    typeof filterArray[0] === 'string' &&
    filterArray[0] !== 'all'
  ) {
    return ['all', filterArray] as FilterSpecification
  }

  // Case: Array of filter expressions that we cleanup recursively and then wrap
  const flatFilterArray = _flattenFilter(filterArray)

  if (flatFilterArray.length === 0) {
    return ['all'] as FilterSpecification
  }

  return ['all', ...flatFilterArray] as FilterSpecification
}
