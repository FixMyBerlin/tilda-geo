import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { persistOsmUserDescriptionIfPresent } from './actions/pollOsmUserDescription.server'
import { updateOsmDescription } from './mutations/updateOsmDescription.server'
import { updateUserWithData } from './mutations/updateUser.server'
import { getCurrentUser } from './queries/getCurrentUser.server'
import { getUserWithMemberships } from './queries/getUserWithMemberships.server'
import { UpdateOsmDescription, UpdateUserSchema } from './schema'

export const getCurrentUserLoaderFn = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser(getRequestHeaders())
  return { user }
})

const GetUserWithMembershipsInput = z.object({ userId: z.string() })

export const getUserWithMembershipsFn = createServerFn({ method: 'GET' })
  .validator((data: z.infer<typeof GetUserWithMembershipsInput>) =>
    GetUserWithMembershipsInput.parse(data),
  )
  .handler(async ({ data }) => getUserWithMemberships(data, getRequestHeaders()))

export const persistOsmUserDescriptionIfPresentFn = createServerFn({ method: 'POST' }).handler(
  async () => persistOsmUserDescriptionIfPresent(),
)

export const updateOsmDescriptionFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateOsmDescription>) => UpdateOsmDescription.parse(data))
  .handler(async ({ data }) => updateOsmDescription(data, getRequestHeaders()))

export const updateUserFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof UpdateUserSchema>) => UpdateUserSchema.parse(data))
  .handler(async ({ data }) => updateUserWithData(data, getRequestHeaders()))
