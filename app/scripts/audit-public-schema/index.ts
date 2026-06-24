#!/usr/bin/env bun

/**
 * audit-public-schema — interactive CLI to find and DROP stale objects in the geo/tile `public`
 * schema, using the local dev database as the source of truth for "what current code builds".
 *
 * The rationale, the step-by-step flow, and usage all live in ./README.md (the canonical doc) —
 * intentionally not repeated here.
 */

import * as p from '@clack/prompts'
import { SQL } from 'bun'
import { getBaseDatabaseUrl } from '../../src/server/database-url.server'
// Shared with the db-pull tooling so tunnel handling stays consistent.
import {
  type AllowedSource,
  getRemoteDatabaseUrl,
  looksLikeConnectionError,
  printRemoteConnectionGuidance,
} from '../db-pull/db-helpers'

const STALENESS_WARN_DAYS = 14
const TUNNEL_POLL_SECONDS = 5

type DbObject =
  | { kind: 'table'; name: string; bytes: number; sizePretty: string; estRows: number }
  | { kind: 'function'; name: string; args: string }

function objectKey(object: DbObject) {
  return object.kind === 'table'
    ? `table:${object.name}`
    : `function:${object.name}(${object.args})`
}

function objectLabel(object: DbObject) {
  if (object.kind === 'function') return `${object.name}(${object.args})`
  const rows =
    object.estRows < 0 ? 'row count unknown' : `~${object.estRows.toLocaleString('en-US')} rows`
  return `${object.name}  ·  ${object.sizePretty}, ${rows}`
}

/** Escape a Postgres identifier for safe interpolation into DDL. */
function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`
}

function errMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/** Distinguish "tunnel/connection is down" (retryable) from auth/permission errors (fatal). */
function isConnectionError(error: unknown) {
  const message = errMessage(error).toLowerCase()
  const code = (error as { code?: string } | null)?.code
  return (
    looksLikeConnectionError(message) ||
    message.includes('connect') ||
    ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'].includes(code ?? '')
  )
}

async function fetchPublicObjects(db: SQL) {
  const tables = await db<
    { name: string; bytes: string | number; size_pretty: string; est_rows: string | number }[]
  >`
    SELECT c.relname AS name,
           pg_total_relation_size(c.oid)::bigint AS bytes,
           pg_size_pretty(pg_total_relation_size(c.oid)) AS size_pretty,
           c.reltuples::bigint AS est_rows
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
    ORDER BY c.relname`

  const functions = await db<{ name: string; args: string | null }[]>`
    SELECT p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname`

  return [
    ...tables.map((row) => ({
      kind: 'table' as const,
      name: row.name,
      bytes: Number(row.bytes),
      sizePretty: row.size_pretty,
      estRows: Number(row.est_rows),
    })),
    ...functions.map((row) => ({
      kind: 'function' as const,
      name: row.name,
      args: row.args ?? '',
    })),
  ]
}

/**
 * Reports each readiness check as a green ✓ or a warning.
 * `null` signals the user aborted on a failed check (so the caller stops).
 */
async function checkLocalReference(local: SQL) {
  p.log.success('Local dev database reachable')

  const objects = await fetchPublicObjects(local)
  const tableCount = objects.filter((o) => o.kind === 'table').length
  const functionCount = objects.filter((o) => o.kind === 'function').length
  const atlasFunctionCount = objects.filter(
    (o) => o.kind === 'function' && o.name.startsWith('atlas_generalized_'),
  ).length

  if (tableCount === 0) {
    p.log.error(
      '`public` schema has no tables — local DB is not processed; it cannot be a reference',
    )
    p.cancel('Run the processing pipeline locally first, then re-run this CLI.')
    return null
  }
  p.log.success(`\`public\` has ${tableCount} tables`)

  if (functionCount === 0) {
    p.log.error(
      '`public` schema has no functions — the app has likely never booted against this DB',
    )
    p.cancel('Start the app locally so it registers the tile functions, then re-run this CLI.')
    return null
  }
  p.log.success(`\`public\` has ${functionCount} functions`)

  // The atlas_generalized_* functions are registered by the APP, not the pipeline. If they're absent
  // locally, every such function in the remote would be a false orphan — warn loudly.
  if (atlasFunctionCount === 0) {
    p.log.warn(
      'No `atlas_generalized_*` functions found locally. Boot the app locally first, otherwise all\n' +
        'remote tile functions will be flagged as orphans (false positives).',
    )
    const proceed = await p.confirm({ message: 'Continue anyway?', initialValue: false })
    if (p.isCancel(proceed) || !proceed) {
      p.cancel('Aborted.')
      return null
    }
  } else {
    p.log.success(`\`public\` has ${atlasFunctionCount} \`atlas_generalized_*\` tile functions`)
  }

  // Last processing run — read the `meta` table the pipeline maintains.
  const metaExists = (
    await local<{ rel: string | null }[]>`SELECT to_regclass('public.meta') AS rel`
  )[0]?.rel
  if (!metaExists) {
    p.log.warn('No `public.meta` table — cannot confirm when processing last ran here')
  } else {
    const lastRun = (
      await local<{ processing_completed_at: string; age_days: string | number }[]>`
      SELECT processing_completed_at,
             EXTRACT(EPOCH FROM (now() - processing_completed_at)) / 86400 AS age_days
      FROM public.meta
      WHERE processing_completed_at IS NOT NULL
      ORDER BY processing_completed_at DESC
      LIMIT 1`
    )[0]

    if (!lastRun) {
      p.log.warn(
        '`public.meta` has no completed processing run — the local reference may be partial',
      )
    } else {
      const ageDays = Number(lastRun.age_days)
      const when = new Date(lastRun.processing_completed_at)
        .toISOString()
        .slice(0, 16)
        .replace('T', ' ')
      if (ageDays > STALENESS_WARN_DAYS) {
        p.log.warn(
          `Last local processing run was ${ageDays.toFixed(0)} days ago (${when} UTC) — consider re-processing for an accurate reference`,
        )
      } else {
        p.log.success(`Last local processing run: ${when} UTC (${ageDays.toFixed(1)} days ago)`)
      }
    }
  }

  return objects
}

/** Probe a connection once, surfacing any error so the caller can decide retry vs. fail. */
async function probe(url: string) {
  const db = new SQL(url)
  try {
    await db`SELECT 1`
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error }
  } finally {
    await db.end().catch(() => {})
  }
}

/**
 * Connect to the remote source. If the tunnel is down, show the same guidance as db-pull and poll
 * every few seconds until it comes up (Ctrl-C to abort). Non-connection errors fail immediately.
 */
async function connectRemote(source: AllowedSource, url: string) {
  let result = await probe(url)

  if (!result.ok) {
    if (!isConnectionError(result.error)) {
      throw new Error(`Could not connect to ${source}: ${errMessage(result.error)}`)
    }

    printRemoteConnectionGuidance(source, url)

    const spin = p.spinner()
    spin.start(
      `Waiting for the ${source} tunnel — re-checking every ${TUNNEL_POLL_SECONDS}s (Ctrl-C to abort)`,
    )
    let elapsed = 0
    while (!result.ok) {
      await Bun.sleep(TUNNEL_POLL_SECONDS * 1000)
      elapsed += TUNNEL_POLL_SECONDS
      spin.message(`Waiting for the ${source} tunnel — ${elapsed}s elapsed (Ctrl-C to abort)`)
      result = await probe(url)
    }
    spin.stop(`Tunnel up — connected to ${source}.`)
  }

  return new SQL(url)
}

async function main() {
  p.intro('audit-public-schema — clean stale objects from the geo/tile `public` schema')

  // ── 1+2. Check the local dev DB is a valid reference, reporting green checks ──────────────────
  const local = new SQL(getBaseDatabaseUrl())
  try {
    await local`SELECT 1`
  } catch (error) {
    p.cancel(`Local dev database not reachable: ${errMessage(error)}`)
    await local.end().catch(() => {})
    return
  }

  const localObjects = await checkLocalReference(local)
  if (!localObjects) {
    await local.end().catch(() => {})
    return
  }
  const localKeys = new Set(localObjects.map(objectKey))

  // ── 3. Choose the environment to audit (staging first is recommended) ─────────────────────────
  const source = (await p.select({
    message: 'Audit which environment?',
    options: [
      { value: 'staging', label: 'staging', hint: 'do this one first' },
      { value: 'production', label: 'production' },
    ],
    initialValue: 'staging',
  })) as AllowedSource | symbol
  if (p.isCancel(source)) {
    p.cancel('Aborted.')
    await local.end().catch(() => {})
    return
  }

  // ── 4–6. Connect to the remote (resolve URL, wait for the tunnel) ─────────────────────────────
  let remoteUrl: string
  try {
    remoteUrl = getRemoteDatabaseUrl(source)
  } catch (error) {
    p.cancel(errMessage(error))
    await local.end().catch(() => {})
    return
  }

  let remote: SQL
  try {
    remote = await connectRemote(source, remoteUrl)
  } catch (error) {
    p.cancel(errMessage(error))
    await local.end().catch(() => {})
    return
  }

  try {
    // ── 7. Inventory the remote and diff against the local reference ────────────────────────────
    const remoteObjects = await fetchPublicObjects(remote)
    const candidates = remoteObjects.filter((o) => !localKeys.has(objectKey(o)))

    p.log.info(
      `${source}: ${remoteObjects.length} objects in \`public\`, ${candidates.length} not built by your local dev code.`,
    )

    if (candidates.length === 0) {
      p.outro(`Nothing stale — ${source}.public matches your local dev build. ✨`)
      return
    }

    p.note(
      [
        `These exist in ${source}.public but NOT in your local dev build.`,
        'If you did not process every region/topic locally (e.g. parking for Berlin/Bielefeld),',
        'some may be false positives — review carefully before selecting.',
      ].join('\n'),
      'Heads up',
    )

    // ── 8. Multi-select what to drop ────────────────────────────────────────────────────────────
    const selectedKeys = (await p.multiselect({
      message: `Select objects to DROP from ${source}.public (space to toggle, enter to confirm)`,
      options: candidates.map((o) => ({
        value: objectKey(o),
        label: objectLabel(o),
        hint: o.kind,
      })),
      required: false,
    })) as string[] | symbol
    if (p.isCancel(selectedKeys) || selectedKeys.length === 0) {
      p.outro('Nothing selected — no changes made.')
      return
    }

    const toDrop = candidates.filter((o) => selectedKeys.includes(objectKey(o)))

    // Confirm — and require typing the env name for production.
    const confirmed = await p.confirm({
      message: `Permanently DROP ${toDrop.length} object(s) from ${source.toUpperCase()} public schema?`,
      initialValue: false,
    })
    if (p.isCancel(confirmed) || !confirmed) {
      p.outro('Cancelled — no changes made.')
      return
    }
    if (source === 'production') {
      const typed = await p.text({
        message: 'This is PRODUCTION. Type "production" to confirm:',
        validate: (value) =>
          value === 'production' ? undefined : 'Type "production" or press Esc to cancel.',
      })
      if (p.isCancel(typed)) {
        p.outro('Cancelled — no changes made.')
        return
      }
    }

    // ── 9. Drop each object; DDL is schema-qualified and IF EXISTS. No CASCADE — a dependency
    //       error surfaces per-object instead of silently cascading. ─────────────────────────────
    const spin = p.spinner()
    spin.start(`Dropping ${toDrop.length} object(s) from ${source} …`)
    const results: { object: DbObject; ok: boolean; error?: string }[] = []
    for (const object of toDrop) {
      const ddl =
        object.kind === 'table'
          ? `DROP TABLE IF EXISTS public.${quoteIdent(object.name)};`
          : `DROP FUNCTION IF EXISTS public.${quoteIdent(object.name)}(${object.args});`
      try {
        await remote.unsafe(ddl)
        results.push({ object, ok: true })
      } catch (error) {
        results.push({ object, ok: false, error: errMessage(error) })
      }
    }
    spin.stop(`Finished dropping on ${source}.`)

    for (const result of results) {
      if (result.ok) p.log.success(`Dropped ${objectKey(result.object)}`)
      else p.log.error(`FAILED ${objectKey(result.object)}  →  ${result.error}`)
    }

    const okCount = results.filter((r) => r.ok).length
    const failCount = results.length - okCount
    p.outro(
      failCount === 0
        ? `Dropped ${okCount}/${toDrop.length} from ${source}.${source === 'staging' ? ' Re-run for production once staging looks healthy.' : ''}`
        : `Dropped ${okCount}/${toDrop.length}; ${failCount} failed (see errors above — likely dependencies; resolve then re-run).`,
    )
  } finally {
    await remote.end().catch(() => {})
    await local.end().catch(() => {})
  }
}

try {
  await main()
  process.exit(0)
} catch (error) {
  p.log.error(errMessage(error))
  process.exit(1)
}
