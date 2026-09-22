import { Prisma, UserRoleEnum } from '@/prisma/generated/client'
import { adminFormAuditContext, runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { errorState, successState } from '@/server/utils/validation'
import type { MembershipParsed } from '../schema'

export async function createMembershipWithData(data: MembershipParsed, headers: Headers) {
  try {
    const admin = await requireAdmin(headers)
    const { userId, role, regionId } = data

    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!user) {
      return { success: false, message: 'Der gewählte User existiert nicht (mehr).', errors: {} }
    }

    const roleChanged = user.role !== role
    if (roleChanged && userId === admin.userId && role !== UserRoleEnum.ADMIN) {
      return {
        success: false,
        message: 'Du kannst dir die Admin-Rechte nicht selbst entziehen.',
        errors: { role: ['Eigene Admin-Rechte können nicht entzogen werden.'] },
      }
    }
    if (!roleChanged && regionId === undefined) {
      return {
        success: false,
        message: 'Keine Änderung: Bitte eine Region oder eine andere Rolle wählen.',
        errors: { regionId: ['Bitte eine Region wählen.'] },
      }
    }

    await runWithAuditContextAsync(adminFormAuditContext(headers, admin.userId), async () => {
      if (regionId !== undefined) {
        await db.membership.create({ data: { userId, regionId } })
      }
      if (roleChanged) {
        await db.user.update({ where: { id: userId }, data: { role } })
      }
    })
    return successState()
  } catch (error) {
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
    return errorState(error, 'Fehler beim Speichern der Rechte')
  }
}
