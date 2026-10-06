/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { adminActiveSectionRootMargin } from '@/components/admin/adminClasses'
import { useActiveSectionId } from './useActiveSectionId'

let observerCallback: IntersectionObserverCallback | undefined
let observerOptions: IntersectionObserverInit | undefined

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    observerCallback = callback
    observerOptions = options
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const intersect = (...visibleIds: string[]) => {
  const entries = ['a', 'b', 'c'].map((id) => ({
    target: document.getElementById(id),
    isIntersecting: visibleIds.includes(id),
  }))
  act(() => {
    observerCallback?.(
      entries as unknown as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    )
  })
}

const Harness = () => {
  const { activeId, jumpToSection } = useActiveSectionId(['a', 'b', 'c'])
  return (
    <>
      <section id="a" />
      <section id="b" />
      <section id="c" />
      <output data-testid="active">{activeId}</output>
      <button type="button" onClick={() => jumpToSection('c')}>
        jump
      </button>
    </>
  )
}

describe('useActiveSectionId', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    Element.prototype.scrollIntoView = scrollIntoView
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    scrollIntoView.mockReset()
    observerCallback = undefined
  })

  test('starts on the first section and observes the upper-third band', () => {
    render(<Harness />)

    expect(screen.getByTestId('active').textContent).toBe('a')
    expect(observerOptions?.rootMargin).toBe(adminActiveSectionRootMargin)
  })

  test('activates the first intersecting section in document order', () => {
    render(<Harness />)

    intersect('b')
    expect(screen.getByTestId('active').textContent).toBe('b')

    intersect('b', 'c')
    expect(screen.getByTestId('active').textContent).toBe('b')

    intersect()
    expect(screen.getByTestId('active').textContent).toBe('b')
  })

  test('jump scrolls smoothly, writes the hash and pins until the user scrolls', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'jump' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(window.location.hash).toBe('#c')
    expect(screen.getByTestId('active').textContent).toBe('c')

    intersect('b')
    expect(screen.getByTestId('active').textContent).toBe('c')

    fireEvent.wheel(window)
    intersect('b')
    expect(screen.getByTestId('active').textContent).toBe('b')
  })

  test('honours prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'jump' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  test('scrolls to the hash section on load without animation and pins it', () => {
    window.history.replaceState(null, '', '/#c')
    render(<Harness />)

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
    // A short last section may never reach the band; the pin keeps it active anyway.
    intersect('b')
    expect(screen.getByTestId('active').textContent).toBe('c')
  })
})
