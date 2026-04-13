import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createMembershipWithData } from './mutations/createMembership.server'
import { deleteMembership } from './mutations/deleteMembership.server'
import { updateMembership } from './mutations/updateMembership.server'
import { MembershipSchema } from './schema'

const DeleteMembershipInput = z.object({ id: z.number() })
const UpdateMembershipInput = MembershipSchema.extend({ id: z.number() })

export const deleteMembershipFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteMembershipInput>) =>
    DeleteMembershipInput.parse(data),
  )
  .handler(async ({ data }) => deleteMembership(data, getRequestHeaders()))

export const createMembershipFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof MembershipSchema>) => MembershipSchema.parse(data))
  .handler(async ({ data }) => createMembershipWithData(data, getRequestHeaders()))

export const updateMembershipFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateMembershipInput>) =>
    UpdateMembershipInput.parse(data),
  )
  .handler(async ({ data }) => updateMembership(data, getRequestHeaders()))
