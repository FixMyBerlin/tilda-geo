import { toast } from 'sonner'
import { z } from 'zod'

const errorWithMessageSchema = z.object({ message: z.string().min(1) })

/** Reads `.message` from `Error` and `{ message }` (Better Upload); skips `[object Object]`. */
export const getErrorMessage = (error: unknown, fallback: string) => {
  const parsed = errorWithMessageSchema.safeParse(error)
  if (!parsed.success || parsed.data.message === '[object Object]') return fallback
  return parsed.data.message
}

/** Show an error toast; reads `.message` from `Error` and `{ message }` (Better Upload). */
export function toastError(error: unknown, fallback = 'Ein Fehler ist aufgetreten') {
  toast.error(getErrorMessage(error, fallback))
}
