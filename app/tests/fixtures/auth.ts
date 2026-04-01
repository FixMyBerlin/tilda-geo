import { createHash, createHmac, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { test as base } from '@playwright/test'
import db from '../../src/server/db.server'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_STORAGE_PATH = path.join(__dirname, '../.auth/session.json')
const PLAYWRIGHT_SESSION_COOKIE = 'tilda.session_token'
const PLAYWRIGHT_SESSION_DATA_COOKIE = 'tilda.session_data'

export type AuthenticatedContext = {
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    expires?: number
  }>
  userId: string
  expiresAt: number
}

export function hasValidSession() {
  if (!fs.existsSync(AUTH_STORAGE_PATH)) {
    return false
  }

  try {
    const sessionData = JSON.parse(
      fs.readFileSync(AUTH_STORAGE_PATH, 'utf-8'),
    ) as AuthenticatedContext

    const now = Date.now()
    const expiresAt = sessionData.expiresAt
    const buffer = 5 * 60 * 1000

    return expiresAt > now + buffer
  } catch {
    return false
  }
}

export function loadSession(): AuthenticatedContext | null {
  if (!hasValidSession()) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(AUTH_STORAGE_PATH, 'utf-8')) as AuthenticatedContext
  } catch {
    return null
  }
}

export function saveSession(session: AuthenticatedContext) {
  const dir = path.dirname(AUTH_STORAGE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(AUTH_STORAGE_PATH, JSON.stringify(session, null, 2))
}

export async function switchUserToAdmin(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
  })
}

export async function resetSession(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  })
}

export async function getAuthenticatedContext(page: Page) {
  const session = loadSession()
  if (!session) {
    return false
  }

  await page.context().addCookies(session.cookies)
  return true
}

function signSessionCookieValue(token: string) {
  const secret = process.env.SESSION_SECRET_KEY
  if (!secret) {
    throw new Error('SESSION_SECRET_KEY is required for stubbed Playwright login')
  }

  const signature = createHmac('sha256', secret).update(token).digest('base64')
  return encodeURIComponent(`${token}.${signature}`)
}

function createSessionDataCookieValue({
  user,
  session,
}: {
  user: Awaited<ReturnType<typeof db.user.create>>
  session: Awaited<ReturnType<typeof db.session.create>>
}) {
  const secret = process.env.SESSION_SECRET_KEY
  if (!secret) {
    throw new Error('SESSION_SECRET_KEY is required for stubbed Playwright login')
  }

  const sessionData = {
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      token: session.token,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      userId: session.userId,
    },
    user: {
      id: user.id,
      name: user.osmName,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.osmAvatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      osmId: user.osmId,
      osmDescription: user.osmDescription,
      role: user.role,
      additionalFields: {
        osmId: user.osmId,
        osmName: user.osmName,
        osmDescription: user.osmDescription,
        role: user.role,
      },
    },
    updatedAt: Date.now(),
    version: '1',
  }

  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000
  const signature = createHmac('sha256', secret)
    .update(JSON.stringify({ ...sessionData, expiresAt }))
    .digest('base64url')
  const compactPayload = Buffer.from(
    JSON.stringify({
      session: sessionData,
      expiresAt,
      signature,
    }),
  ).toString('base64url')
  return encodeURIComponent(compactPayload)
}

type StubbedSessionRole = 'ADMIN' | 'USER'

type StubbedSessionOptions = {
  identityKey?: string
}

function createStableHash(input: string) {
  return createHash('sha256').update(input).digest('hex').slice(0, 8)
}

function normalizeIdentityKey(identityKey?: string) {
  return (identityKey ?? 'default').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)
}

function getStubbedIdentity(role: StubbedSessionRole, identityKey?: string) {
  const normalizedKey = normalizeIdentityKey(identityKey)
  const roleLabel = role.toLowerCase()
  const hash = createStableHash(`${role}:${normalizedKey}`)
  const hashAsNumber = Number.parseInt(hash, 16)
  const osmId = 1_000_000_000 + (hashAsNumber % 999_999_999)

  return {
    key: normalizedKey,
    osmId,
    osmName: `playwright-${roleLabel}-${normalizedKey}`,
    email: `playwright-${roleLabel}-${normalizedKey}-${hash}@users.openstreetmap.invalid`,
  }
}

async function upsertStubbedUser(role: StubbedSessionRole, identityKey?: string) {
  const identity = getStubbedIdentity(role, identityKey)

  return db.user.upsert({
    where: { email: identity.email },
    update: {
      osmId: identity.osmId,
      osmName: identity.osmName,
      role,
      firstName: null,
      lastName: null,
    },
    create: {
      osmId: identity.osmId,
      osmName: identity.osmName,
      role,
      email: identity.email,
    },
  })
}

export async function cleanupStubbedSessionData(role: StubbedSessionRole, identityKey?: string) {
  const identity = getStubbedIdentity(role, identityKey)
  const user = await db.user.findUnique({
    where: { email: identity.email },
    select: { id: true },
  })
  if (!user) return

  await db.session.deleteMany({
    where: { userId: user.id },
  })
}

async function createStubbedSession(
  page: Page,
  baseURL: string,
  role: StubbedSessionRole,
  options?: StubbedSessionOptions,
) {
  const user = await upsertStubbedUser(role, options?.identityKey)
  await db.session.deleteMany({
    where: { userId: user.id },
  })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  const createdSession = await db.session.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
      ipAddress: '127.0.0.1',
      userAgent: 'playwright-stubbed-login',
    },
  })

  await page.context().addCookies([
    {
      name: PLAYWRIGHT_SESSION_COOKIE,
      value: signSessionCookieValue(token),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(expiresAt.getTime() / 1000),
    },
    {
      name: PLAYWRIGHT_SESSION_DATA_COOKIE,
      value: createSessionDataCookieValue({ user, session: createdSession }),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000),
    },
  ])

  return user
}

export async function createStubbedAdminSession(
  page: Page,
  baseURL: string,
  options?: StubbedSessionOptions,
) {
  return createStubbedSession(page, baseURL, 'ADMIN', options)
}

export async function createStubbedUserSession(
  page: Page,
  baseURL: string,
  options?: StubbedSessionOptions,
) {
  return createStubbedSession(page, baseURL, 'USER', options)
}

export async function getAdminContext(_page: Page) {
  const session = loadSession()
  if (!session) {
    throw new Error('No stored session found. Run auth-setup.spec.ts first.')
  }

  await switchUserToAdmin(session.userId)
  await resetSession(session.userId)

  throw new Error(
    'Admin context requires re-authentication. This should be handled by auth-setup.spec.ts',
  )
}

export const test = base.extend<{
  authenticatedPage: Page
  adminPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    const hasSession = await getAuthenticatedContext(page)
    if (!hasSession) {
      throw new Error('No valid session found. Run auth-setup.spec.ts first to create a session.')
    }
    await use(page)
  },

  adminPage: async ({ page }, use) => {
    await getAdminContext(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
