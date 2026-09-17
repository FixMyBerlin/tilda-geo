export const regionsWithSelectedFirst = <T extends { slug: string }>(
  regions: T[],
  selectedSlugs: readonly string[],
) => {
  const selected = new Set(selectedSlugs)
  return [...regions].sort((a, b) => {
    const aSelected = selected.has(a.slug)
    const bSelected = selected.has(b.slug)
    if (aSelected === bSelected) return 0
    return aSelected ? -1 : 1
  })
}
