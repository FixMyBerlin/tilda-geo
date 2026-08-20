import { parseDataSchemaSpec, type DataSchemaSpec } from './dataSchemaSpec.schema'

export function parseDataSchemaSpecText(text: string, table: string) {
  let raw: unknown
  try {
    raw = Bun.YAML.parse(text)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Invalid YAML for "${table}": ${detail}`)
  }
  if (Array.isArray(raw)) {
    throw new Error(`Expected a single YAML document for "${table}"`)
  }
  return parseDataSchemaSpec(raw, table)
}

export function stringifyDataSchemaSpec(spec: DataSchemaSpec) {
  return `${Bun.YAML.stringify(spec, null, 2).trimEnd()}\n`
}
