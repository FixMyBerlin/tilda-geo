export const toggleIdInList = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]

export const removeIdFromList = (ids: string[], id: string) => ids.filter((value) => value !== id)

export const reorderIds = (ids: string[], newOrder: string[]) => {
  const idSet = new Set(ids)
  if (newOrder.length !== ids.length) return ids
  if (!newOrder.every((id) => idSet.has(id))) return ids
  return newOrder
}
