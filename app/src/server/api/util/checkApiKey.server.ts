import { timingSafeEqual } from 'node:crypto'
import type { z } from 'zod'
import { isDev, isStaging } from '@/components/shared/utils/isEnv'

export const parseData = <T extends z.ZodTypeAny>(body: unknown, Schema: T) => {
  try {
    const data = Schema.parse(body)
    return { ok: true, data, errorResponse: null } as const
  } catch (e) {
    const responseData: Record<string, unknown> = { statusText: 'Bad Request' }
    if (isDev || isStaging) {
      responseData.error = e
    }
    return {
      ok: false,
      data: null,
      errorResponse: Response.json(responseData, { status: 400 }),
    } as const
  }
}

/**
 * Timing-safe comparison of API keys to prevent timing attacks.
 *
 * **Security Context:**
 * Standard string comparison (e.g., `===`) leaks timing information because it short-circuits
 * on the first differing character. An attacker can measure response times to gradually discover
 * the correct API key character-by-character by observing which comparisons take longer.
 *
 * **How it works:**
 * Uses `crypto.timingSafeEqual()` which performs byte-wise comparison in constant time,
 * ensuring the comparison always takes the same duration regardless of where differences occur.
 *
 * **References:**
 * - Node.js docs: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
 * - OWASP Timing Attack: https://owasp.org/www-community/attacks/Timing_Attack
 * - Cloudflare Workers example: https://developers.cloudflare.com/workers/examples/protect-against-timing-attacks
 */
export function compareApiKeyTimingSafe(providedKey: string | null | undefined) {
  const expectedKey = process.env.ATLAS_API_KEY
  if (!expectedKey) {
    return false
  }

  if (!providedKey || providedKey.length !== expectedKey.length) {
    return false
  }

  const providedKeyBuffer = Buffer.from(providedKey, 'utf8')
  const expectedKeyBuffer = Buffer.from(expectedKey, 'utf8')

  return timingSafeEqual(providedKeyBuffer, expectedKeyBuffer)
}

export const checkApiKey = (data: Request | Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'development') {
    return { ok: true as const, errorResponse: null }
  }

  let apiKey: string | null
  if (data instanceof Request) {
    apiKey = new URL(data.url).searchParams.get('apiKey')
  } else if ('apiKey' in data && typeof data.apiKey === 'string') {
    apiKey = data.apiKey
  } else {
    apiKey = null
  }

  if (compareApiKeyTimingSafe(apiKey)) {
    return { ok: true as const, errorResponse: null }
  } else {
    return {
      ok: false as const,
      errorResponse: Response.json({ statusText: 'Unauthorized' }, { status: 401 }),
    }
  }
}
