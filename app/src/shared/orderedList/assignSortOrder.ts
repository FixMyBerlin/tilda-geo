export const withSortOrder = <T extends { sortOrder: number }>(items: T[]) =>
  items.map((item, index) => ({ ...item, sortOrder: index }))
