/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { Markdown } from './Markdown'

vi.mock('@/components/shared/links/Link', () => ({
  Link: (props: {
    href?: string
    to?: string
    children?: ReactNode
    blank?: boolean
    className?: string
  }) =>
    props.href != null ? (
      <a
        href={props.href}
        data-blank={props.blank ? 'true' : undefined}
        className={props.className}
      >
        {props.children}
      </a>
    ) : (
      <a href={String(props.to)} data-internal="true" className={props.className}>
        {props.children}
      </a>
    ),
}))

describe('Markdown', () => {
  test('maps markdown headings to paragraph + strong', () => {
    const { container } = render(<Markdown markdown={'# Title\n\n## Sub'} />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(2)
    expect(paragraphs[0]?.querySelector('strong')?.textContent).toBe('Title')
    expect(paragraphs[1]?.querySelector('strong')?.textContent).toBe('Sub')
  })

  test('renders GFM table', () => {
    const md = `| a | b |
| - | - |
| 1 | 2 |`
    const { container } = render(<Markdown markdown={md} />)
    expect(container.querySelector('table')).toBeTruthy()
    expect(container.querySelectorAll('th').length).toBe(2)
  })

  test('treats http(s) links as external', () => {
    render(<Markdown markdown={'[x](https://example.com/path)'} />)
    const link = screen.getByRole('link', { name: 'x' })
    expect(link).toHaveAttribute('href', 'https://example.com/path')
    expect(link).toHaveAttribute('data-blank', 'true')
  })

  test('treats other hrefs as internal router links', () => {
    render(<Markdown markdown={'[home](/regionen/foo)'} />)
    const link = screen.getByRole('link', { name: 'home' })
    expect(link).toHaveAttribute('href', '/regionen/foo')
    expect(link).toHaveAttribute('data-internal', 'true')
  })

  test('does not render raw HTML from markdown as DOM elements', () => {
    const { container } = render(
      <Markdown markdown={'Hello <script>alert(1)</script> <b>bold</b>'} />,
    )
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })
})
