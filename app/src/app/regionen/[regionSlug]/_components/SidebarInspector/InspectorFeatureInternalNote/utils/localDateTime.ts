export const localDateTime = (date: Date | undefined | null) => {
  if (!date) return undefined
  return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
