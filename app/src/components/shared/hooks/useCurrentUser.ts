import { UserRoleEnum } from '@prisma/client'
import { authClient } from '@/components/shared/auth/auth-client'

export const useCurrentUser = () => {
  const { data: session } = authClient.useSession()
  if (!session?.user) return null

  const user = session.user
  const additionalFields = user.additionalFields || {}

  return {
    id: user.id,
    osmId: additionalFields.osmId || 0,
    osmName: user.name || additionalFields.osmName || null,
    role: session.role || UserRoleEnum.USER,
    email: user.email ?? '',
    osmAvatar: user.image || null,
    osmDescription: additionalFields.osmDescription || null,
    firstName: null,
    lastName: null,
  }
}
