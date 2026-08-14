const DATA_SCHEMA_README = '../data-schema/README.md'

export type DataSchemaDocChapter = 'new-table' | 'existing-table'

/** Shared --help pointer; commands run from `app/`. */
export function formatDataSchemaDocsHelp(chapter: DataSchemaDocChapter) {
  return `General setup: Read ${DATA_SCHEMA_README}#${chapter}`
}
