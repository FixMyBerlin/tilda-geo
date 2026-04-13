import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import type { InternalPath } from '@/router'
import { requireAdmin } from '@/server/auth/session.server'

export const PRIVATE_HOOK_SLUGS = [
  'register-sql-functions',
  'post-processing-statistics',
  'post-processing-qa-update',
  'warm-cache',
  'generate-maproulette-tasks',
] as const

export type PrivateHookSlug = (typeof PRIVATE_HOOK_SLUGS)[number]

const PRIVATE_HOOK_PATH_BY_SLUG = {
  'register-sql-functions': '/api/private/register-sql-functions',
  'post-processing-statistics': '/api/private/post-processing-statistics',
  'post-processing-qa-update': '/api/private/post-processing-qa-update',
  'warm-cache': '/api/private/warm-cache',
  'generate-maproulette-tasks': '/api/private/generate-maproulette-tasks',
} as const satisfies Record<PrivateHookSlug, InternalPath>

const PrivateHookSlugSchema = z.enum(PRIVATE_HOOK_SLUGS)

const TriggerPrivateHookInput = z.object({
  slug: PrivateHookSlugSchema,
})

export const adminPrivateHookUiItems = [
  {
    slug: 'register-sql-functions',
    label: 'SQL-Funktionen registrieren',
    confirmMessage:
      'SQL-Funktionen in der Datenbank registrieren? Läuft im Hintergrund; zuerst ausführen, bevor die Statistik gestartet wird.',
  },
  {
    slug: 'post-processing-statistics',
    label: 'Statistik / Analysis',
    confirmMessage:
      'Statistik-Pipeline (analysis) starten? Läuft im Hintergrund; setzt voraus, dass die SQL-Funktionen bereits registriert sind.',
  },
  {
    slug: 'post-processing-qa-update',
    label: 'QA-Auswertungen aktualisieren',
    confirmMessage: 'QA-Auswertungen für alle Regionen neu berechnen? Läuft im Hintergrund.',
  },
  {
    slug: 'warm-cache',
    label: 'Tile-Cache aufwärmen',
    confirmMessage:
      'Tile-Cache für alle konfigurierten Regionen aufwärmen? Kann sehr lange dauern; die Anfrage wartet bis zum Abschluss.',
    longRunning: true,
  },
  {
    slug: 'generate-maproulette-tasks',
    label: 'MapRoulette-Aufgaben erzeugen',
    confirmMessage: 'MapRoulette-Rebuild starten? Läuft im Hintergrund.',
  },
] as const satisfies readonly {
  slug: PrivateHookSlug
  label: string
  confirmMessage: string
  longRunning?: boolean
}[]

export const triggerPrivateHookAdminFn = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof TriggerPrivateHookInput>) =>
    TriggerPrivateHookInput.parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeaders())
    const apiKey = process.env.ATLAS_API_KEY
    const origin = process.env.VITE_APP_ORIGIN
    if (!apiKey || !origin) {
      return { ok: false as const, status: 500, message: 'Server-Konfiguration unvollständig' }
    }
    const path = PRIVATE_HOOK_PATH_BY_SLUG[data.slug]
    const url = new URL(path, origin)
    url.searchParams.set('apiKey', apiKey)
    const response = await fetch(url, { method: 'GET' })
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = null
    }
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : response.statusText
    return {
      ok: response.ok as boolean,
      status: response.status,
      message,
    }
  })
