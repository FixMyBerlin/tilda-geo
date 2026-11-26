import { splitSemicolonRespectingBrackets } from '../utils/splitSemicolonRespectingBrackets'

export type Share = {
  label: string
  /** @desc As written in the text, e.g. `<1 %` */
  percentText: string
  /** @desc Normalized to a sum of 100, since the rounded percents rarely are */
  width: number
}

const SHARE_ENTRY = /^(<1|\d+(?:[.,]\d+)?) ?% (.+)$/

/** `null` when one entry does not match, so the row shows the text instead. */
export const parseShares = (input: unknown): Share[] | null => {
  if (typeof input !== 'string') return null

  const entries = splitSemicolonRespectingBrackets(input).map((entry) => entry.match(SHARE_ENTRY))
  if (!entries.length || entries.some((match) => !match)) return null

  const shares = entries.map((match) => {
    const [, rawPercent, label] = match!
    const percent = rawPercent === '<1' ? 0.5 : Number(rawPercent!.replace(',', '.'))
    return { label: label!.trim(), percentText: `${rawPercent}\u00a0%`, percent }
  })
  const total = shares.reduce((sum, share) => sum + share.percent, 0)
  if (total <= 0) return null

  return shares.map(({ label, percentText, percent }) => ({
    label,
    percentText,
    width: (percent / total) * 100,
  }))
}
