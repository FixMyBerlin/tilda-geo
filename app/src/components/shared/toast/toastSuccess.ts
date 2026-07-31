import { toast } from 'sonner'

/** Show a success toast. */
export function toastSuccess(message = 'Gespeichert.') {
  toast.success(message)
}
