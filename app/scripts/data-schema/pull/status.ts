import { dataSchemaSnapshotSpecKey, dataSchemaSpecKey } from '@/server/dataSchema/dataSchemaS3Keys'

export function describePullMissingOnS3(input: {
  table: string
  snapshotId?: string
  hasLocalSpec: boolean
}) {
  const s3Key = input.snapshotId
    ? dataSchemaSnapshotSpecKey(input.table, input.snapshotId)
    : dataSchemaSpecKey(input.table)
  const s3Place = input.snapshotId
    ? `S3 snapshot ${input.snapshotId} (${s3Key})`
    : `S3 object ${s3Key}`

  if (input.hasLocalSpec) {
    return {
      line: `${input.table}: nothing to pull — ${s3Place} is missing. Local data-schema/${input.table}/spec.yaml is unchanged (pull only downloads).`,
      summary: 'S3 missing, local kept',
    }
  }
  return {
    line: `${input.table}: nothing to pull — ${s3Place} is missing, and there is no local spec either.`,
    summary: 'S3 missing, no local',
  }
}

export function formatPullOutro(input: {
  pulled: number
  total: number
  localKeptMissingS3: number
  localOnly: string[]
}) {
  const pulled = `Pulled ${input.pulled}/${input.total} spec(s) from S3.`
  const hints: string[] = []
  if (input.localKeptMissingS3 > 0 || input.localOnly.length > 0) {
    hints.push(
      'Local specs are not uploaded by pull. Next: bun run data-schema-load, then bun run data-schema-publish.',
    )
  }
  if (input.localOnly.length > 0) {
    hints.push(`Local-only (not listed on S3): ${input.localOnly.join(', ')}`)
  }
  return hints.length > 0 ? `${pulled} ${hints.join(' ')}` : pulled
}

export function formatEmptyS3PullMessage(localTables: string[]) {
  if (localTables.length === 0) {
    return 'No tables found under data-schema/ on S3.'
  }
  return `No tables found under data-schema/ on S3. Local specs are already here (${localTables.join(', ')}). Pull only downloads; next: bun run data-schema-load, then bun run data-schema-publish.`
}
