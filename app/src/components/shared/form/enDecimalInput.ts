/** Partial EN decimal while typing: optional minus, digits, one dot. */
export const isPartialEnDecimalInput = (value: string) =>
  value === '' || value === '-' || /^-?\d*(\.\d*)?$/.test(value)

/** Complete EN decimal with dot separator (no comma). */
export const isValidEnDecimalInput = (value: string) => /^-?\d+(\.\d+)?$/.test(value.trim())

export const EN_DECIMAL_HELP = 'Dezimalpunkt (EN-Format), z. B. 51.07'
