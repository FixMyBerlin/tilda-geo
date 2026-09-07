/** First 2–3 keys from review entry `data` as a compact "k: v" summary. */
export const formatReviewEntryDataSummary = (data: unknown) => {
  if (!data || typeof data !== 'object') return ''
  const entries = Object.entries(data).slice(0, 3)
  if (!entries.length) return ''
  const text = entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ')
  return text.length > 80 ? `${text.slice(0, 79)}…` : text
}
