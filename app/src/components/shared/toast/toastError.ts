import { toast } from 'sonner'
import { z } from 'zod'

const errorWithMessageSchema = z.object({ message: z.string().min(1) })

/** Show an error toast; reads `.message` from `Error` and `{ message }` (Better Upload). */
export function toastError(error: unknown, fallback = 'Ein Fehler ist aufgetreten') {
  const parsed = errorWithMessageSchema.safeParse(error)
  toast.error(parsed.success ? parsed.data.message : fallback)
}
