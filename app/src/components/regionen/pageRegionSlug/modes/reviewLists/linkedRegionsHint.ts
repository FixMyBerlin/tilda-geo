import { frenchQuote } from '@/components/shared/text/Quotes'

export const formatLinkedRegionsHint = (names: readonly string[]) => {
  if (names.length < 2) return undefined
  const quoted = names.map((name) => frenchQuote(name))
  const last = quoted.at(-1)
  const rest = quoted.slice(0, -1).join(', ')
  return `Diese Liste ist mit den Regionen ${rest} und ${last} verknüpft.`
}
