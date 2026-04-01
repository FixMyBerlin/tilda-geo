import { z } from 'zod'

const withMessageSchema = z.object({ message: z.string() })
const withFormSchema = z.object({ form: z.string() })
const recordSchema = z.record(z.string(), z.unknown())

/** Normalize form/field error to string (Standard Schema and adapters may return objects with .message). */
export function formatFormError(err: unknown) {
  const visit = (value: unknown, seen: WeakSet<object>) => {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value)
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => visit(item, seen))
        .filter(Boolean)
        .join(', ')
    }

    if (typeof value === 'object') {
      if (seen.has(value)) return ''
      seen.add(value)

      const withMessage = withMessageSchema.safeParse(value)
      if (withMessage.success) {
        return withMessage.data.message
      }

      const withForm = withFormSchema.safeParse(value)
      if (withForm.success) {
        return withForm.data.form
      }

      const recordResult = recordSchema.safeParse(value)
      if (!recordResult.success) return ''

      const nested = Object.values(recordResult.data)
        .map((item) => visit(item, seen))
        .filter(Boolean)

      if (nested.length > 0) {
        return Array.from(new Set(nested)).join(', ')
      }

      try {
        return JSON.stringify(value)
      } catch {
        return ''
      }
    }

    return String(value)
  }

  return visit(err, new WeakSet())
}

/** Deduplicate by formatted message — Zod/adapters may attach multiple issues with the same text; keys must stay unique in lists. */
export function uniqueFormattedFormErrors(errors: unknown[] | undefined) {
  if (!errors?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const err of errors) {
    const s = formatFormError(err)
    if (s !== '' && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}
