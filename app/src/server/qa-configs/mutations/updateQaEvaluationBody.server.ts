import { z } from 'zod'
import {
  memberFormAuditContext,
  runWithAuditContextAsync,
} from '@/server/audit/auditContext.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAuth } from '@/server/auth/session.server'
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
  headers: Headers,
) {
  const session = await requireAuth(headers)
  const { regionSlug, evaluationId, body } = UpdateQaEvaluationBodySchema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  const evaluation = await db.qaEvaluation.findFirstOrThrow({
    where: { id: evaluationId, config: { region: { slug: regionSlug } } },
    select: { userId: true, evaluatorType: true },
  })
  if (evaluation.evaluatorType !== 'USER' || evaluation.userId !== session.userId) {
    throw new AuthorizationError('Only the author can update this comment')
  }

  return runWithAuditContextAsync(memberFormAuditContext(headers, session.userId), () =>
    db.qaEvaluation.update({
      where: { id: evaluationId },
      data: { body },
      select: { id: true, body: true, updatedAt: true },
    }),
  )
}
