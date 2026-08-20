const DATA_SCHEMA_README = '../data-schema/README.md'

export type DataSchemaDocChapter = 'get-data-onto-every-environment' | 'new-or-updated-data'

/** Shared --help pointer; commands run from `app/`. */
export function formatDataSchemaDocsHelp(chapter: DataSchemaDocChapter) {
  return `General setup: Read ${DATA_SCHEMA_README}#${chapter}`
}
