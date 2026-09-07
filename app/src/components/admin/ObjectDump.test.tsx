/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ObjectDump } from './ObjectDump'

describe('ObjectDump', () => {
  test('renders a floating overlay button, not an in-flow JSON Dump summary', () => {
    const { container } = render(
      <div className="relative">
        <p>visible content</p>
        <ObjectDump title="note" data={{ id: 1 }} />
      </div>,
    )

    expect(container.querySelector('details')).toBeNull()
    expect(screen.queryByText(/JSON Dump note/)).toBeNull()
    expect(screen.getByRole('button', { name: 'JSON Dump note' })).toBeTruthy()
  })

  test('opens the JSON dump in a popover', async () => {
    render(<ObjectDump title="note" data={{ id: 1 }} />)

    fireEvent.click(screen.getByRole('button', { name: 'JSON Dump note' }))

    expect(await screen.findByText(/"id": 1/)).toBeTruthy()
  })
})
