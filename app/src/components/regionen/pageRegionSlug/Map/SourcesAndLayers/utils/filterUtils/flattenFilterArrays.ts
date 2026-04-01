const removeAll = (array: unknown[]) => {
  if (array[0] === 'all') {
    return array.slice(1)
  }
  return array
}

export const flattenFilterArrays = (
  array1: unknown[] | undefined,
  array2: unknown[] | undefined,
) => {
  if (array1 === undefined) return array2
  if (array2 === undefined) return array1

  const clean1 = removeAll(array1)
  const clean2 = removeAll(array2)

  const is1Flat = typeof clean1[0] !== 'object'
  const is2Flat = typeof clean2[0] !== 'object'

  if (is1Flat && is2Flat) return [clean1, clean2]
  if (is1Flat && !is2Flat) return [clean1, ...clean2]
  if (!is1Flat && is2Flat) return [...clean1, clean2]
  if (!is1Flat && !is2Flat) return [...clean1, ...clean2]
}
