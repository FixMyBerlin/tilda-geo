import { describe, expect, test } from 'vitest'
import migration from './0003_notes_params'

const run = (search: string) => {
  const url = new URL(`https://example.com/regionen/berlin${search}`)
  return new URL(migration(url.toString(), { categories: [] })).searchParams
}

describe('0003_notes_params migration', () => {
  test('renames atlasNote → internalNote and keeps visibility flags', () => {
    const params = run('?notes=true&atlasNote=15/52.5/13.4&osmNotes=true')
    expect(params.get('internalNotes')).toBe('true')
    expect(params.get('internalNote')).toBe('15/52.5/13.4')
    expect(params.get('osmNotes')).toBe('true')
    expect(params.has('notes')).toBe(false)
    expect(params.has('atlasNote')).toBe(false)
  })

  test('converts v2 osmNotesFilter into flat notesMode JSON', () => {
    const filter = encodeURIComponent(JSON.stringify({ query: 'kreuzung', completed: false }))
    const params = run(`?osmNotesFilter=${filter}&osmNotes=true`)
    expect(params.has('osmNotesFilter')).toBe(false)
    expect(params.get('osmNotes')).toBe('true')
    expect(JSON.parse(params.get('notesMode')!)).toEqual({
      search: 'kreuzung',
      completed: false,
    })
  })

  test('converts v2 atlasNotesFilter into flat notesMode JSON', () => {
    const filter = encodeURIComponent(JSON.stringify({ commented: true, user: '12' }))
    const params = run(`?atlasNotesFilter=${filter}`)
    expect(params.has('atlasNotesFilter')).toBe(false)
    expect(JSON.parse(params.get('notesMode')!)).toEqual({
      commented: true,
      user: '12',
    })
  })

  test('converts this-branch 2026 slug--all into qa JSON with the same key', () => {
    const params = run('?qa=euvm-parkraum-2026--all')
    expect(JSON.parse(params.get('qa')!)).toEqual({ key: 'euvm-parkraum-2026' })
  })

  test('keeps JSON qa key as-is', () => {
    const params = run('?qa={"key":"euvm-parkraum-2025","status":"pending-problematic"}')
    expect(JSON.parse(params.get('qa')!)).toEqual({
      key: 'euvm-parkraum-2025',
      status: 'pending-problematic',
    })
  })

  test('keeps JSON qa with an unknown key unchanged', () => {
    const params = run('?qa={"key":"my-new-config","status":"pending-problematic"}')
    expect(JSON.parse(params.get('qa')!)).toEqual({
      key: 'my-new-config',
      status: 'pending-problematic',
    })
  })

  test('keeps unknown-key JSON qa and merges qaFilter.users', () => {
    const qaFilter = encodeURIComponent(JSON.stringify({ users: ['12'] }))
    const params = run(`?qa={"key":"my-new-config"}&qaFilter=${qaFilter}`)
    expect(params.has('qaFilter')).toBe(false)
    expect(JSON.parse(params.get('qa')!)).toEqual({
      key: 'my-new-config',
      users: ['12'],
    })
  })

  test('maps eUVM 2025 slug--all to qa JSON with the same key', () => {
    const params = run('?qa=euvm-parkraum-2025--all')
    expect(JSON.parse(params.get('qa')!)).toEqual({ key: 'euvm-parkraum-2025' })
  })

  test('maps eUVM 2025-aussen status and merges qaFilter.users', () => {
    const qaFilter = encodeURIComponent(JSON.stringify({ users: ['12'] }))
    const params = run(
      `?qa=euvm-parkraum-2025-aussen--user-pending-problematic&qaFilter=${qaFilter}`,
    )
    expect(params.has('qaFilter')).toBe(false)
    expect(JSON.parse(params.get('qa')!)).toEqual({
      key: 'euvm-parkraum-2025-aussen',
      status: 'pending-problematic',
      users: ['12'],
    })
  })

  test('maps user-selected to users array only', () => {
    const qaFilter = encodeURIComponent(JSON.stringify({ users: ['12'] }))
    const params = run(`?qa=euvm-parkraum-2025--user-selected&qaFilter=${qaFilter}`)
    expect(JSON.parse(params.get('qa')!)).toEqual({
      key: 'euvm-parkraum-2025',
      users: ['12'],
    })
  })

  test('maps none to dropping qa', () => {
    const params = run('?qa=euvm-parkraum-2025--none')
    expect(params.has('qa')).toBe(false)
  })

  test('maps user-pending alias to pending-problematic', () => {
    const params = run('?qa=euvm-parkraum-2025--user-pending')
    expect(JSON.parse(params.get('qa')!)).toEqual({
      key: 'euvm-parkraum-2025',
      status: 'pending-problematic',
    })
  })

  test('drops unknown qa slug', () => {
    const params = run('?qa=my-config--all')
    expect(params.has('qa')).toBe(false)
  })

  test('drops unknown qa status', () => {
    const params = run('?qa=euvm-parkraum-2025--actionable')
    expect(params.has('qa')).toBe(false)
  })

  test('does not change the pathname', () => {
    const url = new URL(
      migration('https://example.com/regionen/berlin?osmNotes=true', { categories: [] }),
    )
    expect(url.pathname).toBe('/regionen/berlin')
  })
})
