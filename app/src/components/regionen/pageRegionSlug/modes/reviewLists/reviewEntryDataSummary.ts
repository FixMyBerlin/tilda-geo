/** First 2–3 keys from review entry `data` as a compact "k: v" summary. */
export const formatReviewEntryDataSummary = (data: Record<string, string> | null | undefined) => {
  const entries = Object.entries(data ?? {}).slice(0, 3)
  if (!entries.length) return ''
  return entries.map(([key, value]) => `${key}: ${value}`).join(' · ')
}
