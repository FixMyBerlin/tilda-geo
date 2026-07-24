import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import { RegionNotFoundError } from '@/server/regions/regionWriteErrors.server'

export function isPrismaRecordNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

type AdminApiErrorOptions = {
  fallbackMessage: string
  /** Map guard `Error` instances to 409 instead of 400 (DELETE blockers). */
  conflictOnGuardError?: boolean
}

function uniqueConstraintMessage(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target
  if (Array.isArray(target) && target.some((field) => String(field).includes('slug'))) {
    return 'Region with this slug already exists'
  }
  return 'Duplicate value'
}

export function adminApiErrorResponse(error: unknown, options: AdminApiErrorOptions) {
  if (error instanceof z.ZodError) {
    return Response.json({ message: 'Validation failed', issues: error.issues }, { status: 400 })
  }
  if (error instanceof RegionNotFoundError || isPrismaRecordNotFound(error)) {
    return Response.json({ message: 'Not found' }, { status: 404 })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return Response.json({ message: uniqueConstraintMessage(error) }, { status: 409 })
  }
  if (error instanceof Error) {
    const status = options.conflictOnGuardError ? 409 : 400
    return Response.json({ message: error.message }, { status })
  }
  return Response.json({ message: options.fallbackMessage }, { status: 500 })
}
