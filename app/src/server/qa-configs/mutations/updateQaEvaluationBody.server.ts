import { z } from 'zod'
import { runWithAuditContextAsync } from '@/server/audit/auditContext.server'
import { AuthorizationError } from '@/server/auth/errors'
import {
  type MemberCaller,
  memberAuditContext,
  requireMemberSession,
} from '@/server/auth/memberCaller.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

export const UpdateQaEvaluationBodySchema = z.object({
  regionSlug: z.string(),
  evaluationId: z.number(),
  body: z.string(),
})

/** Author edits the comment of their own user evaluation. Status stays unchanged (history row). */
export async function updateQaEvaluationBody(
  input: z.infer<typeof UpdateQaEvaluationBodySchema>,
  caller: MemberCaller,
) {
  const session = await requireMemberSession(caller)
  const { regionSlug, evaluationId, body } = UpdateQaEvaluationBodySchema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const evaluation = await db.qaEvaluation.findFirstOrThrow({
    where: { id: evaluationId, config: { region: { slug: regionSlug } } },
    select: { userId: true, evaluatorType: true },
  })
  if (evaluation.evaluatorType !== 'USER' || evaluation.userId !== session.userId) {
    throw new AuthorizationError('Only the author can update this comment')
  }

  return runWithAuditContextAsync(memberAuditContext(caller, session.userId), () =>
    db.qaEvaluation.update({
      where: { id: evaluationId },
      data: { body },
      select: { id: true, body: true, updatedAt: true },
    }),
  )
}
