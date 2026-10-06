/** @vitest-environment jsdom */
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function Harness({ onConfirm }: { onConfirm: () => void | Promise<void> }) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title="Eintrag löschen"
      icon={ExclamationTriangleIcon}
      confirmLabel="Löschen"
      onConfirm={onConfirm}
      tone="danger"
    />
  )
}

describe('ConfirmDialog', () => {
  test('clicking the confirm button calls onConfirm', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<Harness onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })

  test('while pending, both buttons are disabled and the spinner shows', async () => {
    let resolveConfirm: () => void = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve
        }),
    )
    render(<Harness onConfirm={onConfirm} />)

    const cancelButton = screen.getByRole('button', { name: 'Abbrechen' })
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    await waitFor(() => expect(screen.getByText('Loading')).toBeTruthy())
    expect(cancelButton).toBeDisabled()

    resolveConfirm()
    await waitFor(() => expect(cancelButton).not.toBeDisabled())
  })

  test('renders the error message when onConfirm rejects', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Netzwerkfehler'))
    render(<Harness onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Netzwerkfehler')
  })
})
