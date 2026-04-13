import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, validationErrorState } from '@/server/utils/validation'
import type { MembershipParsed } from '../schema'

export async function createMembershipWithData(data: MembershipParsed, headers: Headers) {
  try {
    await requireAdmin(headers)
    await db.membership.create({ data })
    return { success: true, message: '', errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: 'Dieser User ist für diese Region bereits eingetragen.',
          errors: { regionId: ['Bereits Mitglied in dieser Region.'] },
        }
      }
      if (error.code === 'P2003') {
        return {
          success: false,
          message: 'Die gewählte Region oder der User existiert nicht (mehr).',
          errors: {},
        }
      }
    }
    return errorState(error, 'Fehler beim Erstellen der Mitgliedschaft')
  }
}
