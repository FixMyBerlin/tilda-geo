import { toast } from 'sonner'
import { describe, expect, test, vi } from 'vitest'
import { toastError } from './toastError'

describe('toastError', () => {
  test('uses Error.message', () => {
    const spy = vi.spyOn(toast, 'error').mockImplementation(() => '')
    toastError(new Error('boom'))
    expect(spy).toHaveBeenCalledWith('boom')
    spy.mockRestore()
  })

  test('uses message from a Better Upload error object', () => {
    const spy = vi.spyOn(toast, 'error').mockImplementation(() => '')
    toastError({
      type: 'invalid_file_type',
      message: 'One or more files have an invalid file type.',
    })
    expect(spy).toHaveBeenCalledWith('One or more files have an invalid file type.')
    spy.mockRestore()
  })

  test('falls back when there is no message', () => {
    const spy = vi.spyOn(toast, 'error').mockImplementation(() => '')
    toastError({ foo: 1 }, 'Nope')
    expect(spy).toHaveBeenCalledWith('Nope')
    spy.mockRestore()
  })
})
