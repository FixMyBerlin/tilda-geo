import { toast } from 'sonner'

/** Show an error toast; prefers `Error.message` when available. */
export function toastError(error: unknown, fallback = 'Ein Fehler ist aufgetreten') {
  toast.error(error instanceof Error ? error.message : fallback)
}
