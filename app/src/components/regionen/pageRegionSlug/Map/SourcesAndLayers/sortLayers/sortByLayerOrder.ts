// Sorts layer entries by a bottom-first order list (admin DB keys).
// Pass orderedKeys: [] to keep the input order (empty DB table).
// Entries whose key is not in the list keep their original relative order
// and are placed after all known keys (= rendered on top of them within their beforeId group).
export function sortByLayerOrder<T>({
  items,
  getKey,
  orderedKeys,
}: {
  items: T[]
  getKey: (item: T) => string
  orderedKeys: readonly string[]
}) {
  const orderMap = new Map<string, number>()
  orderedKeys.forEach((key, index) => orderMap.set(key, index))
  // Array.prototype.sort is stable, so unlisted keys keep their relative order.
  const rank = (item: T) => orderMap.get(getKey(item)) ?? orderedKeys.length
  return [...items].sort((a, b) => rank(a) - rank(b))
}
