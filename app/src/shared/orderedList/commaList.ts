export const parseCommaList = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean)

export const joinCommaList = (items: string[]) => items.join(', ')
