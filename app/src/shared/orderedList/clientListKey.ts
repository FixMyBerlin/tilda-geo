/** Client-only stable identity for drag-reorder lists (not persisted). */
export type WithClientListKey<T> = T & { _key: string }

export const newClientListKey = () => crypto.randomUUID()

export const withClientListKeys = <T extends { _key?: string }>(
  items: T[],
): WithClientListKey<T>[] =>
  items.map((item) =>
    item._key ? (item as WithClientListKey<T>) : { ...item, _key: newClientListKey() },
  )
