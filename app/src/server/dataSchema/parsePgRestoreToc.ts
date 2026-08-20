/**
 * Guard for admin Import: after the dump SHA matches the manifest, before DROP + pg_restore.
 *
 * `pg_restore --list` prints the custom-archive table of contents (object types, not row data).
 * We parse that text and reject anything that is not `data.<this table>` (plus its indexes /
 * sequences / constraints). Publish already dumps with `pg_dump --table=`, so a normal dump
 * always passes; this catches a wrong or extra-wide archive on S3 before restore can create
 * functions, other schemas, or other tables.
 */

type PgRestoreTocEntry = {
  dumpId: number
  desc: string
  schema: string | null
  /** For TABLE / TABLE DATA: table name. For CONSTRAINT / DEFAULT: table name. For INDEX / SEQUENCE: object name. */
  name: string
  /** For CONSTRAINT: the constraint name. For DEFAULT: the column name. */
  objectName?: string
  /** True when the TOC line could not be classified at all. */
  unparseable?: boolean
  raw?: string
}

/** TOC object types allowed in a single-table data.* dump (allowlist — unknown types are rejected). */
const ALLOWED_TOC_DESCS = new Set([
  'TABLE',
  'TABLE DATA',
  'INDEX',
  'CONSTRAINT',
  'SEQUENCE',
  'SEQUENCE SET',
  // pg_dump emits this for serial/identity columns; still scoped to the table via sequence name.
  'SEQUENCE OWNED BY',
  'DEFAULT',
  'COMMENT',
])

// Longest-first so "SEQUENCE SET" / "TABLE DATA" / "SEQUENCE OWNED BY" win over shorter prefixes.
const KNOWN_DESCS = [
  'SEQUENCE OWNED BY',
  'MATERIALIZED VIEW',
  'FK CONSTRAINT',
  'ROW SECURITY',
  'SEQUENCE SET',
  'TABLE DATA',
  'TABLE',
  'INDEX',
  'CONSTRAINT',
  'SEQUENCE',
  'VIEW',
  'TYPE',
  'COMMENT',
  'ACL',
  'TRIGGER',
  'RULE',
  'POLICY',
  'DEFAULT',
  'BLOB',
  'FUNCTION',
  'PROCEDURE',
  'AGGREGATE',
  'OPERATOR',
  'SCHEMA',
  'EXTENSION',
  'CAST',
  'COLLATION',
  'CONVERSION',
  'LANGUAGE',
  'LARGE OBJECT',
  'STATISTICS',
] as const

/**
 * Parse `pg_restore --list` TOC lines.
 * Format: `dumpId; tableOid oid DESC schema tag owner`
 * Every non-comment line yields an entry (unknown/unparseable lines included so the guard can reject them).
 */
export function parsePgRestoreToc(stdout: string) {
  const entries: PgRestoreTocEntry[] = []
  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line || line.startsWith(';')) continue

    const match = line.match(/^(\d+);\s+\d+\s+\d+\s+(.+)$/)
    if (!match) {
      entries.push({
        dumpId: -1,
        desc: 'UNPARSEABLE',
        schema: null,
        name: line,
        unparseable: true,
        raw: line,
      })
      continue
    }

    const dumpId = Number(match[1])
    const rest = match[2]!
    const parsed = parseTocRest(rest)
    if (!parsed) {
      entries.push({
        dumpId,
        desc: 'UNPARSEABLE',
        schema: null,
        name: rest,
        unparseable: true,
        raw: line,
      })
      continue
    }
    entries.push({ dumpId, ...parsed })
  }
  return entries
}

function parseTocRest(rest: string) {
  for (const desc of KNOWN_DESCS) {
    if (!rest.startsWith(`${desc} `)) continue
    const afterDesc = rest.slice(desc.length + 1).trimEnd()
    const parts = afterDesc.split(/\s+/).filter((p) => p.length > 0)
    // Owner may be absent (empty column); need at least schema + tag.
    if (parts.length < 2) return null

    const schemaRaw = parts[0]!
    const schema = schemaRaw === '-' ? null : schemaRaw
    // parts.length === 2 → schema + tag, no owner; otherwise last token is owner.
    const tagParts = parts.length === 2 ? parts.slice(1) : parts.slice(1, -1)
    if (tagParts.length === 0) return null

    if (desc === 'CONSTRAINT' || desc === 'FK CONSTRAINT') {
      if (tagParts.length < 2) {
        return { desc, schema, name: tagParts[0]!, objectName: undefined }
      }
      return {
        desc,
        schema,
        name: tagParts[0]!,
        objectName: tagParts.slice(1).join(' '),
      }
    }

    if (desc === 'DEFAULT') {
      return {
        desc,
        schema,
        name: tagParts[0]!,
        objectName: tagParts.slice(1).join(' ') || undefined,
      }
    }

    if (desc === 'SEQUENCE OWNED BY') {
      // Tag is typically "tablename.column"
      return {
        desc,
        schema,
        name: tagParts.join(' '),
      }
    }

    return {
      desc,
      schema,
      name: tagParts.join(' '),
    }
  }

  // Unknown description: still emit so the allowlist can reject it.
  const parts = rest.split(/\s+/).filter((p) => p.length > 0)
  if (parts.length === 0) return null
  return {
    desc: parts[0]!,
    schema: null,
    name: parts.slice(1).join(' ') || parts[0]!,
  }
}

function entryBelongsToTable(entry: PgRestoreTocEntry, table: string) {
  const { desc, name } = entry
  if (desc === 'TABLE' || desc === 'TABLE DATA') return name === table
  if (desc === 'CONSTRAINT' || desc === 'DEFAULT') return name === table
  // INDEX/SEQUENCE/SEQUENCE SET tags are object names; ogr2ogr/pg_dump names them `{table}_…`.
  // Residual risk: prefix match also accepts an object whose real owner is a different table
  // sharing the prefix (importing `foo`, dump contains `foo_bar_idx` for `data.foo_bar`).
  // TOC lines do not carry the owning table for INDEX/SEQUENCE, so we cannot tighten further
  // without rejecting legitimate `{table}_geom_idx` / `{table}_{col}_seq` names from pg_dump -t.
  // Worst case is an extra index on an unrelated existing data.* table — not code execution.
  if (desc === 'INDEX' || desc === 'SEQUENCE' || desc === 'SEQUENCE SET') {
    return name === table || name.startsWith(`${table}_`)
  }
  if (desc === 'SEQUENCE OWNED BY') {
    return name === table || name.startsWith(`${table}.`) || name.startsWith(`${table}_`)
  }
  if (desc === 'COMMENT') {
    return (
      name === table ||
      name.startsWith(`${table}_`) ||
      name.startsWith(`${table}.`) ||
      name.split(/\s+/).includes(table)
    )
  }
  return false
}

export function assertDumpContainsOnlyTable(stdout: string, table: string) {
  const entries = parsePgRestoreToc(stdout)
  if (entries.length === 0) {
    throw new Error(`pg_restore TOC is empty (expected data.${table})`)
  }

  let sawTable = false
  for (const entry of entries) {
    if (entry.unparseable) {
      throw new Error(`Dump TOC contains unparseable line (rejected): ${entry.raw ?? entry.name}`)
    }

    if (!ALLOWED_TOC_DESCS.has(entry.desc)) {
      throw new Error(
        `Dump contains disallowed TOC entry ${entry.desc} ${entry.schema ?? '-'}.${entry.name} (expected only data.${table} objects)`,
      )
    }

    if (entry.schema !== 'data') {
      throw new Error(
        `Dump contains ${entry.desc} in schema "${entry.schema ?? '-'}" (expected only data.${table})`,
      )
    }

    if (!entryBelongsToTable(entry, table)) {
      throw new Error(
        `Dump contains ${entry.desc} data.${entry.name} (expected only objects belonging to data.${table})`,
      )
    }

    if (entry.desc === 'TABLE') sawTable = true
  }

  if (!sawTable) {
    throw new Error(`Dump TOC missing TABLE entry for data.${table}`)
  }
}
