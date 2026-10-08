import { isNotFound } from '@tanstack/react-router'
import { Prisma } from '@/prisma/generated/client'
import { AuthorizationError } from '@/server/auth/errors'

export const ok = (data: unknown) => ({
  content: [
    {
      type: 'text' as const,
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    },
  ],
})

const errorMessage = (error: unknown) => {
  // Queries shared with the UI signal a missing record with the router's `notFound()`.
  if (isNotFound(error)) return 'Not found'
  // Lookups are scoped to the acting region, so a record of another region is "not found" too.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return 'Not found in this region (check the id and regionSlug)'
  }
  if (error instanceof AuthorizationError) {
    return (
      `Not allowed: ${error.message}. These tools act as the API token owner with the same rules ` +
      'as the region UI; admins get no bypass (e.g. only the author edits or deletes a note or comment).'
    )
  }
  const message = error instanceof Error ? error.message : String(error)
  // Prisma prefixes its messages with the failing call and a source excerpt; the last line says what happened.
  return message.includes('Invalid `') ? (message.trim().split('\n').at(-1) ?? message) : message
}

const fail = (error: unknown) => ({
  content: [{ type: 'text' as const, text: `Error: ${errorMessage(error)}` }],
  isError: true,
})

export const run = async (fn: () => Promise<unknown>) => {
  try {
    return ok(await fn())
  } catch (error) {
    return fail(error)
  }
}
