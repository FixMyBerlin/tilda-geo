import { describe, expect, test } from 'vitest'
import type { TodoId } from '@/data/processingTypes/todoId.generated.const'
import { resolveTaskDisclosureOpen } from './maproulette-tasks-store'

const keyA = 'missing_oneway' as TodoId
const keyB = 'missing_surface' as TodoId
const keyC = 'missing_segregated' as TodoId

describe('resolveTaskDisclosureOpen', () => {
  test('single task with no stored preference opens that task', () => {
    expect(resolveTaskDisclosureOpen(keyA, [keyA], undefined)).toBe(true)
  })

  test('multiple tasks with no stored preference keeps all closed', () => {
    expect(resolveTaskDisclosureOpen(keyA, [keyA, keyB, keyC], undefined)).toBe(false)
    expect(resolveTaskDisclosureOpen(keyB, [keyA, keyB, keyC], undefined)).toBe(false)
    expect(resolveTaskDisclosureOpen(keyC, [keyA, keyB, keyC], undefined)).toBe(false)
  })

  test('stored key present on feature opens only that task', () => {
    expect(resolveTaskDisclosureOpen(keyA, [keyA, keyB, keyC], keyB)).toBe(false)
    expect(resolveTaskDisclosureOpen(keyB, [keyA, keyB, keyC], keyB)).toBe(true)
    expect(resolveTaskDisclosureOpen(keyC, [keyA, keyB, keyC], keyB)).toBe(false)
  })

  test('stored key absent on new feature falls back to defaults', () => {
    expect(resolveTaskDisclosureOpen(keyA, [keyA], keyB)).toBe(true)
    expect(resolveTaskDisclosureOpen(keyA, [keyA, keyB], keyC)).toBe(false)
    expect(resolveTaskDisclosureOpen(keyB, [keyA, keyB], keyC)).toBe(false)
  })

  test('stored null after user close keeps all closed including single task', () => {
    expect(resolveTaskDisclosureOpen(keyA, [keyA], null)).toBe(false)
    expect(resolveTaskDisclosureOpen(keyA, [keyA, keyB], null)).toBe(false)
  })
})
