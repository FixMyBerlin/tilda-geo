export const buildHashtags = (
  id: string | undefined,
  category: string | undefined,
  hasMaproulette?: boolean,
) => {
  return [
    '#radinfra_de',
    id ? `#${id}` : undefined,
    // The other categories are less relevant
    category === 'traffic_signs' ? `#${category}` : undefined,
    hasMaproulette ? '#maproulette' : undefined,
  ]
    .flat()
    .filter(Boolean)
}
