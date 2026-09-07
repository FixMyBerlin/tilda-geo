import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  COMPOSER_DRAFT_TTL_MS,
  COMPOSER_DRAFTS_STORAGE_KEY,
  clearComposerDraftSlot,
  readComposerDraftsForUser,
  writeComposerDraftSlot,
} from './composerDraftStorage'

describe('composerDraftStorage', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
  })

  afterEach(() => {
    storage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('writes one slot without disturbing other slots or other users', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    writeComposerDraftSlot('user-a', 'note:new:internal:berlin', { subject: 'A', body: 'one' })
    writeComposerDraftSlot('user-a', 'note:comment:1', { body: 'reply' })
    writeComposerDraftSlot('user-b', 'note:new:internal:berlin', { subject: 'B', body: 'other' })

    writeComposerDraftSlot('user-a', 'note:new:internal:berlin', { subject: 'A2', body: 'two' })

    expect(readComposerDraftsForUser('user-a')).toEqual({
      'note:new:internal:berlin': { updatedAt: now, values: { subject: 'A2', body: 'two' } },
      'note:comment:1': { updatedAt: now, values: { body: 'reply' } },
    })
    expect(readComposerDraftsForUser('user-b')).toEqual({
      'note:new:internal:berlin': { updatedAt: now, values: { subject: 'B', body: 'other' } },
    })
  })

  test('namespaces drafts by user id', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    writeComposerDraftSlot('user-a', 'note:comment:1', { body: 'mine' })

    expect(readComposerDraftsForUser('user-b')).toEqual({})
    expect(readComposerDraftsForUser('user-a')['note:comment:1']?.values).toEqual({ body: 'mine' })
  })

  test('clears a slot when values are empty or whitespace-only', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    writeComposerDraftSlot('user-a', 'note:comment:1', { body: 'keep me' })
    writeComposerDraftSlot('user-a', 'note:comment:1', { body: '   ' })
    expect(readComposerDraftsForUser('user-a')).toEqual({})

    writeComposerDraftSlot('user-a', 'note:comment:2', { body: 'also' })
    writeComposerDraftSlot('user-a', 'note:comment:2', { body: '' })
    expect(readComposerDraftsForUser('user-a')).toEqual({})
  })

  test('sweeps slots after the 24h cutoff', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    writeComposerDraftSlot('user-a', 'fresh', { body: 'new' })
    writeComposerDraftSlot('user-a', 'stale', { body: 'old' })

    const blob = JSON.parse(storage.get(COMPOSER_DRAFTS_STORAGE_KEY) ?? '{}') as {
      [userId: string]: { [draftId: string]: { updatedAt: number; values: Record<string, string> } }
    }
    const userA = blob['user-a']
    expect(userA).toBeDefined()
    if (!userA) throw new Error('expected user-a drafts')
    const stale = userA.stale
    expect(stale).toBeDefined()
    if (!stale) throw new Error('expected stale slot')
    stale.updatedAt = now - COMPOSER_DRAFT_TTL_MS
    storage.set(COMPOSER_DRAFTS_STORAGE_KEY, JSON.stringify(blob))

    vi.spyOn(Date, 'now').mockReturnValue(now)
    expect(readComposerDraftsForUser('user-a')).toEqual({
      fresh: { updatedAt: now, values: { body: 'new' } },
    })
    const stored = JSON.parse(storage.get(COMPOSER_DRAFTS_STORAGE_KEY) ?? '{}') as {
      [userId: string]: { [draftId: string]: unknown }
    }
    expect(stored['user-a']?.stale).toBeUndefined()
  })

  test('treats malformed JSON as empty', () => {
    storage.set(COMPOSER_DRAFTS_STORAGE_KEY, '{not-json')
    expect(readComposerDraftsForUser('user-a')).toEqual({})

    storage.set(COMPOSER_DRAFTS_STORAGE_KEY, '[]')
    expect(readComposerDraftsForUser('user-a')).toEqual({})

    storage.set(COMPOSER_DRAFTS_STORAGE_KEY, 'null')
    expect(readComposerDraftsForUser('user-a')).toEqual({})
  })

  test('clearComposerDraftSlot removes only that slot', () => {
    const now = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    writeComposerDraftSlot('user-a', 'keep', { body: 'yes' })
    writeComposerDraftSlot('user-a', 'drop', { body: 'no' })
    clearComposerDraftSlot('user-a', 'drop')
    expect(readComposerDraftsForUser('user-a')).toEqual({
      keep: { updatedAt: now, values: { body: 'yes' } },
    })
  })
})
