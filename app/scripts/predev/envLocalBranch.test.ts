import { describe, expect, test } from 'vitest'
import { isFeatureBranch, usesIsolatedDevStack } from './envLocalBranch'

describe('usesIsolatedDevStack', () => {
  test('main checkout on develop uses default stack', () => {
    expect(usesIsolatedDevStack('develop', false)).toBe(false)
  })

  test('main checkout on feature branch uses default stack', () => {
    expect(usesIsolatedDevStack('feature/foo', false)).toBe(false)
  })

  test('worktree on develop uses default stack', () => {
    expect(usesIsolatedDevStack('develop', true)).toBe(false)
  })

  test('worktree on feature branch uses isolated stack', () => {
    expect(usesIsolatedDevStack('feature/foo', true)).toBe(true)
  })
})

describe('isFeatureBranch', () => {
  test('treats develop and main as non-feature', () => {
    expect(isFeatureBranch('develop')).toBe(false)
    expect(isFeatureBranch('main')).toBe(false)
  })

  test('treats other branches as feature branches', () => {
    expect(isFeatureBranch('feature/foo')).toBe(true)
    expect(isFeatureBranch('chore/bar')).toBe(true)
  })
})
