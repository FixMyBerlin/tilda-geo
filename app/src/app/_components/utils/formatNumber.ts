/**
 * Format a number with German locale (1.000 decimal separator) and rounded to 2 digits
 */
export const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a percentage with German locale and rounded to 2 digits
 */
export const formatPercentage = (value: number | null): string => {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
