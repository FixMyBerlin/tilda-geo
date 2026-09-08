import { frenchQuote } from '@/components/shared/text/Quotes'

type Args = {
  /** Plural noun, e.g. `Einträge`, `Bereiche`, `Hinweise`. */
  itemLabel: string
  /** Unfiltered collection size when known (already loaded or counted). */
  totalCount?: number
  extentIsView: boolean
}

/** Visible empty-list copy when a collection has rows but the current filters hide them all. */
export const modeListFilterEmptyMessage = ({ itemLabel, totalCount, extentIsView }: Args) => {
  const totalPart =
    totalCount !== undefined && totalCount > 0
      ? ` ${totalCount.toLocaleString('de-DE')} ${itemLabel} insgesamt.`
      : ''
  const base = `Keine ${itemLabel} für diese Filter.${totalPart}`
  if (!extentIsView) return base
  return `${base} Der Filter ${frenchQuote('Kartenausschnitt')} zeigt in der aktuellen Kartenansicht nichts.`
}
