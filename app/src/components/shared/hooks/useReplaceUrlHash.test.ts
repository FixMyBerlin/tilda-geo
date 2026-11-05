/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useReplaceUrlHash } from './useReplaceUrlHash'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))

describe('useReplaceUrlHash', () => {
  beforeEach(() => {
    navigate.mockClear()
    window.history.replaceState(null, '', '/')
  })

  test('replaces the hash without letting the router scroll', () => {
    const { result } = renderHook(() => useReplaceUrlHash())

    result.current('details')
    expect(navigate).toHaveBeenCalledWith({
      to: '.',
      search: true,
      hash: 'details',
      replace: true,
      resetScroll: false,
      hashScrollIntoView: false,
    })
  })

  test('skips the navigation when the hash is already set', () => {
    window.history.replaceState(null, '', '/#details')
    const { result } = renderHook(() => useReplaceUrlHash())

    result.current('details')
    expect(navigate).not.toHaveBeenCalled()
  })
})
