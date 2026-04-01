import dompurify from 'dompurify'

export function sanitizeHtml(input: string): string
export function sanitizeHtml(input: undefined | null): undefined
export function sanitizeHtml(input: string | undefined | null): string | undefined {
  return input ? dompurify.sanitize(input) : (input ?? undefined)
}
