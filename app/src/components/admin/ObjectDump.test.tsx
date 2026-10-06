/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ObjectDump } from './ObjectDump'

describe('ObjectDump', () => {
  test('renders a collapsed disclosure labelled with the title', () => {
    const { container } = render(<ObjectDump title="Region" data={{ id: 1 }} />)

    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details?.open).toBe(false)
    expect(screen.getByText('Region').closest('summary')).not.toBeNull()
  })

  test('contains the pretty-printed JSON', () => {
    const { container } = render(<ObjectDump title="Region" data={{ id: 1 }} />)

    expect(container.querySelector('pre')?.textContent).toBe('{\n  "id": 1\n}')
  })

  test('renders null for missing data', () => {
    const { container } = render(<ObjectDump data={undefined} />)

    expect(container.querySelector('pre')?.textContent).toBe('null')
  })
})
