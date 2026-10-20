import { toast } from 'sonner'

type ToastSuccessOptions = {
  id?: string | number
}

/** Show a success toast. A stable `id` replaces the previous toast instead of stacking. */
export function toastSuccess(message = 'Gespeichert.', options?: ToastSuccessOptions) {
  if (options) {
    toast.success(message, options)
    return
  }
  toast.success(message)
}
