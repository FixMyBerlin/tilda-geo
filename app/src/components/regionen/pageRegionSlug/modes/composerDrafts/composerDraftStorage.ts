import { z } from 'zod'

export const COMPOSER_DRAFTS_STORAGE_KEY = 'tilda-composer-drafts'
export const COMPOSER_DRAFT_TTL_MS = 24 * 60 * 60 * 1000

const zodComposerDraftSlot = z.object({
  updatedAt: z.number(),
  values: z.record(z.string(), z.string()),
})

export type ComposerDraftSlot = z.infer<typeof zodComposerDraftSlot>

const zodComposerDraftsForUser = z.record(z.string(), zodComposerDraftSlot)

export type ComposerDraftsForUser = z.infer<typeof zodComposerDraftsForUser>

const zodComposerDraftsBlob = z.record(z.string(), zodComposerDraftsForUser)

type ComposerDraftsBlob = z.infer<typeof zodComposerDraftsBlob>

export const isEmptyComposerDraftValues = (values: Record<string, string>) =>
  Object.values(values).every((value) => value.trim() === '')

export const isComposerDraftExpired = (slot: ComposerDraftSlot, now = Date.now()) =>
  now - slot.updatedAt >= COMPOSER_DRAFT_TTL_MS

export const toComposerDraftStringValues = (values: object) => {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(values)) {
    next[key] = typeof value === 'string' ? value : value == null ? '' : String(value)
  }
  return next
}

const sweepComposerDraftsForUser = (drafts: ComposerDraftsForUser, now = Date.now()) => {
  const next: ComposerDraftsForUser = {}
  for (const [draftId, slot] of Object.entries(drafts)) {
    if (isComposerDraftExpired(slot, now)) continue
    next[draftId] = slot
  }
  return next
}

const readBlob = () => {
  if (typeof window === 'undefined') return {} satisfies ComposerDraftsBlob
  try {
    const raw = localStorage.getItem(COMPOSER_DRAFTS_STORAGE_KEY)
    if (!raw) return {} satisfies ComposerDraftsBlob
    const parsed = zodComposerDraftsBlob.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  } catch {
    return {} satisfies ComposerDraftsBlob
  }
}

const writeBlob = (blob: ComposerDraftsBlob) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(COMPOSER_DRAFTS_STORAGE_KEY, JSON.stringify(blob))
  } catch {
    // localStorage blocked or full — drafts are a nicety
  }
}

const persistUserDrafts = (
  blob: ComposerDraftsBlob,
  userId: string,
  drafts: ComposerDraftsForUser,
) => {
  if (Object.keys(drafts).length === 0) {
    const { [userId]: _, ...rest } = blob
    writeBlob(rest)
    return
  }
  writeBlob({ ...blob, [userId]: drafts })
}

export const readComposerDraftsForUser = (userId: string) => {
  const blob = readBlob()
  const swept = sweepComposerDraftsForUser(blob[userId] ?? {})
  if (JSON.stringify(blob[userId] ?? {}) !== JSON.stringify(swept)) {
    persistUserDrafts(blob, userId, swept)
  }
  return swept
}

export const writeComposerDraftSlot = (
  userId: string,
  draftId: string,
  values: Record<string, string>,
) => {
  if (isEmptyComposerDraftValues(values)) {
    clearComposerDraftSlot(userId, draftId)
    return
  }
  const blob = readBlob()
  const userDrafts = sweepComposerDraftsForUser(blob[userId] ?? {})
  userDrafts[draftId] = { updatedAt: Date.now(), values }
  persistUserDrafts(blob, userId, userDrafts)
}

export const clearComposerDraftSlot = (userId: string, draftId: string) => {
  const blob = readBlob()
  const userDrafts = sweepComposerDraftsForUser(blob[userId] ?? {})
  if (!(draftId in userDrafts) && !(userId in blob)) return
  const { [draftId]: _, ...rest } = userDrafts
  persistUserDrafts(blob, userId, rest)
}

export const applyComposerDraftSlot = (
  drafts: ComposerDraftsForUser,
  draftId: string,
  values: Record<string, string>,
) => {
  const swept = sweepComposerDraftsForUser(drafts)
  if (isEmptyComposerDraftValues(values)) {
    const { [draftId]: _, ...rest } = swept
    return rest
  }
  return {
    ...swept,
    [draftId]: { updatedAt: Date.now(), values },
  } satisfies ComposerDraftsForUser
}
