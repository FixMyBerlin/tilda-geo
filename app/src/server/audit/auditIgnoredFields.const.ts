/**
 * Models whose updates are never audited (e.g. session refresh / lastActive bumps).
 * CREATE/DELETE on these models still audit when the model is in AUDITED_MODELS.
 */
export const AUDIT_SKIP_UPDATE_MODELS = ['Session'] as const

/**
 * Auto/telemetry fields: never stored in audit payloads (`fieldFilters.exclude`),
 * and updates that only touch these fields are skipped entirely (avoids leftover
 * `updatedAt`-only rows after filtering).
 */
export const AUDIT_IGNORED_FIELDS = {
  User: ['accessedRegions'],
  AdminApiToken: ['lastUsedAt'],
  // The URL holds a secret token; audit rows outlive the record and a rotated token.
  PrivateBackgroundSource: ['tilesUrl'],
  // Uploads are left out because of their size: "Eigene Daten" are whole FeatureCollections in one
  // column, and every update would copy the old and the new version (other uploads live on S3).
  // A change still shows as `inputUpdatedAt`. The census figures are computed from the geometry.
  // `studyArea` is logged like other drawn geometries (e.g. `ReviewEntry.geometry`).
  PlanningArea: [
    'userDatasets',
    'userGeojson',
    'userGeojsonMode',
    'censusSaettigungEw',
    'censusEwPerHa',
    'censusComputedAt',
  ],
  // Set by the planning-worker when a run finishes.
  PlanningVariant: ['currentRunId'],
} as const
