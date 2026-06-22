/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { MarkdownDocumentHeadingLink } from './MarkdownDocumentHeadingLink'

vi.mock('@tanstack/react-router', () => ({
  useMatch: () => ({
    params: { tableName: 'parkings' },
    search: { r: 'berlin' },
  }),
}))

vi.mock('@/components/shared/links/Link', () => ({
  Link: (props: {
    hash?: string
    to?: string
    params?: { tableName: string }
    search?: { r: string }
    children?: ReactNode
    'aria-label'?: string
  }) => (
    <a
      href={`/docs/${props.params?.tableName}?r=${props.search?.r}#${props.hash}`}
      aria-label={props['aria-label']}
      data-to={props.to}
      data-hash={props.hash}
    >
      {props.children}
    </a>
  ),
}))

describe('MarkdownDocumentHeadingLink', () => {
  test('links to the current docs route with hash', () => {
    render(<MarkdownDocumentHeadingLink hash="capacity-calculation--subtraktives-modell" />)
    const link = screen.getByRole('link', { name: 'Link zu diesem Abschnitt' })
    expect(link).toHaveAttribute(
      'href',
      '/docs/parkings?r=berlin#capacity-calculation--subtraktives-modell',
    )
    expect(link).toHaveAttribute('data-to', '/docs/$tableName')
  })
})
