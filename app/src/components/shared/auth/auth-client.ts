import {
  customSessionClient,
  genericOAuthClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { auth } from '@/server/auth/auth.server'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_ORIGIN,
  plugins: [
    // genericOAuthClient enables OAuth sign-in (required for genericOAuth plugin)
    genericOAuthClient(),
    // customSessionClient handles the customSession plugin (adds role to session)
    customSessionClient<typeof auth>(),
    // inferAdditionalFields automatically infers user.additionalFields from server config
    inferAdditionalFields<typeof auth>(),
  ],
})
