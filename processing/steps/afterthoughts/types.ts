import type { AfterthoughtId, AfterthoughtSkipReason } from '../../constants/afterthoughts.const'

export type AfterthoughtRanEntry = { start: string; end: string }

export type AfterthoughtSkippedEntry = { skipped: AfterthoughtSkipReason }

export type AfterthoughtEntry = AfterthoughtRanEntry | AfterthoughtSkippedEntry

export type ProcessingAfterthoughtsMeta = Partial<Record<AfterthoughtId, AfterthoughtEntry>>

export const afterthoughtSkipped = (skipped: AfterthoughtSkipReason): AfterthoughtSkippedEntry => ({
  skipped,
})
