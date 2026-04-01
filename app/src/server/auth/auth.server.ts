import { UserRoleEnum } from '@prisma/client'
import type { BetterAuthOptions } from 'better-auth'
/**
 * tanstackStartCookies is intentionally NOT used - it pulls @tanstack/react-start/server
 * into the bundle, causing Vite to leak transformStreamWithRouter into the client build.
 * We set cookies manually in api/auth/$ via forwardAuthAndApplyCookies (auth-route-handler.server.ts).
 */
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { customSession } from 'better-auth/plugins'
import { genericOAuth } from 'better-auth/plugins/generic-oauth'
import { getOsmApiUrl, getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import db from '@/server/db.server'
import { sendNewUserRegistration } from '@/server/notifications/sendNewUserRegistration.server'

/** OSM does not provide email. Better Auth generic-oauth requires a non-empty email (throws email_is_missing) and uses it for findOAuthUser; we use a reserved invalid-domain placeholder (RFC 2606). See: https://github.com/better-auth/better-auth/issues/1479 */
const osmPlaceholderEmail = (osmId: number) => `osm-${osmId}@users.openstreetmap.invalid`

/**
 * Custom session plugin that adds role field to session
 * Extracts role from user.additionalFields and includes it in the session response
 *
 * Following Better Auth plugin best practices:
 * https://www.better-auth.com/docs/concepts/plugins#create-a-server-plugin
 */
function customSessionWithRole(options?: BetterAuthOptions) {
  return customSession(({ user, session }) => {
    // additionalFields are configured in user.additionalFields and returned by mapProfileToUser
    // Type assertion needed: Better Auth doesn't infer additionalFields in customSession callback
    // See: https://www.better-auth.com/docs/concepts/typescript#additional-fields
    type UserWithAdditionalFields = typeof user & {
      role?: UserRoleEnum
      additionalFields?: {
        osmId?: number
        osmName?: string | null
        osmDescription?: string | null
        role?: UserRoleEnum
      }
    }
    const userWithFields = user as UserWithAdditionalFields
    const role = userWithFields.additionalFields?.role ?? userWithFields.role ?? UserRoleEnum.USER
    return Promise.resolve({
      user: {
        ...user,
        additionalFields: {
          ...userWithFields.additionalFields,
          role,
        },
      },
      session,
      role,
    })
  }, options)
}

const options = {
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  baseURL: process.env.VITE_APP_ORIGIN,
  secret: process.env.SESSION_SECRET_KEY,
  emailAndPassword: {
    enabled: false, // OSM OAuth only - explicit for clarity
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: 'osm',
          // biome-ignore lint/style/noNonNullAssertion: Guarded by nitro plugin
          clientId: process.env.OSM_CLIENT_ID!,
          // biome-ignore lint/style/noNonNullAssertion: Guarded by nitro plugin
          clientSecret: process.env.OSM_CLIENT_SECRET!,
          discoveryUrl: getOsmUrl('/.well-known/openid-configuration'),
          scopes: ['openid', 'read_prefs', 'write_prefs', 'write_notes'],
          getUserInfo: async ({ accessToken }) => {
            const apiUrl = getOsmApiUrl('/user/details.json')
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            })

            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(
                `Failed to fetch user info: ${response.status} ${response.statusText}. Response: ${errorText}`,
              )
            }

            const json = await response.json()
            if (!json.user) {
              throw new Error('No user object in response')
            }

            const user = json.user
            const out = {
              id: String(user.id),
              name: user.display_name,
              email: null, // OSM doesn't provide email
              emailVerified: false,
              image: user.img?.href || null,
              raw: {
                osmId: Number(user.id),
                osmName: user.display_name,
                osmDescription: user.description,
                osmAvatar: user.img?.href || null,
              },
            }
            return out
          },
          mapProfileToUser: async (arg) => {
            const { id, name, image, raw } = (arg || {}) as {
              id?: string
              name?: string
              image?: string | null
              raw?: {
                osmId?: number
                osmName?: string
                osmDescription?: string
                osmAvatar?: string | null
              }
            }
            // Better Auth passes destructured fields from getUserInfo
            // The raw field contains our custom OSM fields
            const osmId = raw?.osmId ?? Number(id)
            const osmName = raw?.osmName ?? name ?? ''
            const osmDescription = raw?.osmDescription ?? ''
            const osmAvatar = raw?.osmAvatar ?? image ?? null

            // Find or create user
            let user = await db.user.findFirst({ where: { osmId } })

            if (user) {
              user = await db.user.update({
                where: { osmId },
                data: {
                  osmName,
                  osmAvatar,
                  osmDescription,
                  ...(user.email ? {} : { email: osmPlaceholderEmail(osmId) }),
                },
              })
            } else {
              user = await db.user.create({
                data: {
                  osmId,
                  osmName,
                  osmAvatar,
                  osmDescription,
                  role: UserRoleEnum.USER,
                  email: osmPlaceholderEmail(osmId),
                },
              })

              // Send email notification for new user registration
              await sendNewUserRegistration({
                id: user.id,
                osmId: user.osmId,
                osmName: user.osmName,
                osmDescription: user.osmDescription,
                email: user.email,
                createdAt: user.createdAt,
              })
            }

            // Return provider id (osmId) as id so Better Auth creates Account with accountId = OSM user id.
            const outEmail = user.email ?? osmPlaceholderEmail(user.osmId)
            return {
              id: String(user.osmId),
              name: user.osmName || '',
              email: outEmail,
              emailVerified: user.emailVerified ?? false,
              image: user.osmAvatar,
              additionalFields: {
                osmId: user.osmId,
                osmName: user.osmName,
                osmDescription: user.osmDescription,
                role: user.role,
              },
            }
          },
        },
      ],
    }),
  ],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['osm'],
      allowDifferentEmails: true,
    },
  },
  user: {
    modelName: 'user',
    fields: {
      name: 'osmName',
      email: 'email',
      emailVerified: 'emailVerified',
      image: 'osmAvatar',
    },
    additionalFields: {
      osmId: {
        type: 'number',
        input: false, // OSM-sourced field, not user input
      },
      osmDescription: {
        type: 'string',
        input: false, // OSM-sourced field, not user input
      },
      role: {
        type: 'string',
        input: false, // App-managed field, users cannot set this
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches default session expiration)
    },
  },
  advanced: {
    cookiePrefix: 'tilda',
  },
} satisfies BetterAuthOptions

export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins ?? []), customSessionWithRole(options)],
})

export type Session = typeof auth.$Infer.Session
