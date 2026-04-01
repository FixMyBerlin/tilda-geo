import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { pollOsmUserDescription } from './actions/pollOsmUserDescription.server'
import { deleteUser } from './mutations/deleteUser.server'
import { updateOsmDescription } from './mutations/updateOsmDescription.server'
import { updateUserWithData } from './mutations/updateUser.server'
import { getCurrentUser } from './queries/getCurrentUser.server'
import { getUserWithMemberships } from './queries/getUserWithMemberships.server'
import { UpdateOsmDescription, UpdateUserSchema } from './schema'

export const getCurrentUserLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser(getRequestHeaders())
  return { user }
})

const DeleteUserInput = z.object({ userId: z.string() })
const GetUserWithMembershipsInput = z.object({ userId: z.string() })

export const deleteUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof DeleteUserInput>) => DeleteUserInput.parse(data))
  .handler(async ({ data }) => deleteUser(data, getRequestHeaders()))

export const getUserWithMembershipsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: z.infer<typeof GetUserWithMembershipsInput>) =>
    GetUserWithMembershipsInput.parse(data),
  )
  .handler(async ({ data }) => getUserWithMemberships(data, getRequestHeaders()))

export const pollOsmUserDescriptionFn = createServerFn({ method: 'GET' }).handler(async () => {
  return pollOsmUserDescription()
})

export const updateOsmDescriptionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateOsmDescription>) => UpdateOsmDescription.parse(data))
  .handler(async ({ data }) => updateOsmDescription(data, getRequestHeaders()))

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof UpdateUserSchema>) => UpdateUserSchema.parse(data))
  .handler(async ({ data }) => updateUserWithData(data, getRequestHeaders()))
