import {
  CircleStackIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  HomeIcon,
  MapIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentProps, ComponentType } from 'react'
import { isProd } from '@/components/shared/utils/isEnv'
import {
  DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG,
  devRegionErrorPreviewHref,
} from '@/dev/errorPreviews'
import type { InternalPath } from '@/router'
import type { AdminNavCounts } from '@/server/admin/queries/getAdminNavCounts.server'

type AdminNavIcon = ComponentType<ComponentProps<'svg'>>

export type AdminNavCountKey = keyof AdminNavCounts

/** Page inside the admin shell. */
export type AdminNavLink = {
  name: string
  to: InternalPath
  countKey?: AdminNavCountKey
  /** Dashboard card text. */
  description?: string
}

/** Opens outside the admin shell in a new tab. */
type AdminNavExternalLink = {
  name: string
  href: string
}

/** Nested disclosure inside a group (dev tooling only). */
export type AdminNavSubgroup = {
  name: string
  links: AdminNavExternalLink[]
}

export type AdminNavGroup = {
  name: string
  icon: AdminNavIcon
  children: (AdminNavLink | AdminNavSubgroup)[]
}

export type AdminNavItem = (AdminNavLink & { icon: AdminNavIcon }) | AdminNavGroup

const errorPreviewLinks = [
  {
    name: 'Standard Route-Fehler (DefaultError)',
    href: '/preview/default-error' satisfies InternalPath,
  },
  { name: 'Nicht gefunden (NotFound)', href: '/preview/not-found' satisfies InternalPath },
  { name: 'Root ErrorBoundary-Fallback', href: '/preview/root-fallback' satisfies InternalPath },
  { name: 'Region-Fehler (Komponente)', href: '/preview/region-error' satisfies InternalPath },
  {
    name: `Region-Fehler (Route, ${DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG})`,
    href: devRegionErrorPreviewHref(DEV_ERROR_PREVIEW_DEFAULT_REGION_SLUG),
  },
  { name: 'Standard Pending', href: '/preview/default-pending' satisfies InternalPath },
  {
    name: 'Region-Karte Pending (Skeleton)',
    href: '/preview/region-pending' satisfies InternalPath,
  },
] satisfies AdminNavExternalLink[]

/** Single source for the admin sidebar, mobile drawer and dashboard cards. Annotated (not `satisfies`) so `in` checks narrow on the wide item union. */
export const adminNavigation: AdminNavItem[] = [
  { name: 'Übersicht', to: '/admin', icon: HomeIcon },
  {
    name: 'Regionen',
    icon: MapIcon,
    children: [
      {
        name: 'Regionen',
        to: '/admin/regions',
        countKey: 'regions',
        description: 'Regionen anlegen, konfigurieren und Mitglieder verwalten.',
      },
      {
        name: 'Regionen-Aufträge',
        to: '/admin/region-contracts',
        countKey: 'regionContracts',
        description: 'Aufträge und die zugehörigen Regionen.',
      },
      {
        name: 'Prüflisten',
        to: '/admin/review-lists',
        countKey: 'reviewLists',
        description: 'Prüflisten für den Prüfmodus der Regionen.',
      },
      {
        name: 'Hinweis-Ordner',
        to: '/admin/note-folders',
        countKey: 'noteFolders',
        description: 'Ordner für den Hinweise-Modus der Regionen.',
      },
      {
        name: 'QA-Konfigurationen',
        to: '/admin/qa-configs',
        countKey: 'qaConfigsActive',
        description: 'QA-Konfigurationen für den QA-Modus der Regionen (Anzahl aktiv).',
      },
    ],
  },
  {
    name: 'Nutzer & Rechte',
    to: '/admin/memberships',
    icon: UsersIcon,
    countKey: 'users',
    description: 'Nutzer und ihre Mitgliedschaften in Regionen.',
  },
  {
    name: 'Statische Daten',
    icon: CircleStackIcon,
    children: [
      {
        name: 'Uploads',
        to: '/admin/map-dataset-uploads',
        countKey: 'uploads',
        description: 'Hochgeladene Datensätze und ihre Regionen.',
      },
      {
        name: 'Kategorien',
        to: '/admin/map-dataset-categories',
        description: 'Kategorien für statische Datensätze.',
      },
    ],
  },
  {
    name: 'Processing',
    icon: CpuChipIcon,
    children: [
      {
        name: 'Läufe',
        to: '/admin/processing',
        description: 'Processing-Läufe, Themen und nachgelagerte Schritte.',
      },
      {
        name: 'Pipeline-Hooks',
        to: '/admin/processing/hooks',
        description: 'Manuelle Auslöser für die nachgelagerten Schritte des Processing.',
      },
      {
        name: 'Data-Schema',
        to: '/admin/data-schema',
        description: 'Tabellen im Schema data und ihr Veröffentlichungsstand.',
      },
    ],
  },
  {
    name: 'System',
    icon: Cog6ToothIcon,
    children: [
      {
        name: 'Änderungsverlauf',
        to: '/admin/audit-log',
        description: 'Alle Änderungen an Regionen, Aufträgen, Uploads und mehr.',
      },
      {
        name: 'API-Tokens (MCP)',
        to: '/admin/api-tokens',
        description: 'Tokens für den Admin-MCP-Zugang.',
      },
      ...(isProd ? [] : [{ name: 'Vorschau der Fehler-Seiten', links: errorPreviewLinks }]),
    ],
  },
]

type AdminNavLeaf = AdminNavLink & { icon: AdminNavIcon; groupName?: string }

/** Admin-shell pages below the dashboard (skips Übersicht and dev tooling). */
export function adminNavLeaves() {
  const leaves: AdminNavLeaf[] = []
  for (const item of adminNavigation) {
    if ('children' in item) {
      for (const child of item.children) {
        if ('to' in child) leaves.push({ ...child, icon: item.icon, groupName: item.name })
      }
    } else if (item.to !== '/admin') {
      leaves.push(item)
    }
  }
  return leaves
}

function trimTrailingSlash(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

/** Section match: `/admin/regions` is active on `/admin/regions/new`; `/admin` only on itself. */
function isAdminNavPathActive(pathname: string, to: InternalPath) {
  const current = trimTrailingSlash(pathname)
  if (to === '/admin') return current === to
  return current === to || current.startsWith(`${to}/`)
}

export function isAdminNavGroupActive(pathname: string, group: AdminNavGroup) {
  return group.children.some((child) => 'to' in child && isAdminNavPathActive(pathname, child.to))
}

function allAdminNavToPaths() {
  const paths: InternalPath[] = []
  for (const item of adminNavigation) {
    if ('children' in item) {
      for (const child of item.children) {
        if ('to' in child) paths.push(child.to)
      }
    } else {
      paths.push(item.to)
    }
  }
  return paths
}

/**
 * The single nav leaf `to` that should render active for `pathname`. Plain prefix matching would
 * mark both `/admin/processing` (Läufe) and `/admin/processing/hooks` (Pipeline-Hooks) active on
 * `/admin/processing/hooks` since the latter starts with the former; only the longest (most
 * specific) matching `to` wins, so a run detail page (`/admin/processing/$metaId`) still falls
 * back to highlighting `/admin/processing` (Läufe).
 */
export function activeAdminNavToPath(pathname: string) {
  let best: InternalPath | null = null
  for (const to of allAdminNavToPaths()) {
    if (isAdminNavPathActive(pathname, to) && (!best || to.length > best.length)) {
      best = to
    }
  }
  return best
}

/** Sidebar pill label; `null` hides the pill (no count or zero). */
export function formatAdminNavCount(
  counts: AdminNavCounts,
  countKey: AdminNavCountKey | undefined,
) {
  if (!countKey) return null
  const count = counts[countKey]
  if (!count) return null
  return count > 99 ? '99+' : String(count)
}
