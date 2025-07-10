export const berlinTimeString = (dateTime: Date) => {
  return dateTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
}
