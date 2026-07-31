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
} as const
