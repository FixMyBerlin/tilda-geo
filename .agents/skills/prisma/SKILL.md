---
name: prisma
description: >-
  FMC Prisma schema conventions: singular PascalCase models, camelCase fields,
  plural camelCase list relations, singular to-one relations, relation renames,
  Prisma Client regeneration, and migrations. Use when editing or reviewing
  schema.prisma in tilda-geo, trassenscout, or sibling FMC apps.
user-invocable: true
---

# Prisma

Use for FMC `schema.prisma` work. Relation field names are Prisma Client API names, not DB names.

## Naming Rules

- Models are PascalCase singular: `User`, `Region`, `QaConfig`.
- All fields are camelCase: `createdAt`, `maskBufferKm`, `regionId`.
- FK scalars use `{name}Id`: `regionId`, `headerLogoId`.
- To-one relations are singular camelCase: `user User`, `contract RegionContract?`.
- To-many relations are plural camelCase: `memberships Membership[]`, `qaConfigs QaConfig[]`.
- DB names belong in `@map` / `@@map`; do not mirror DB naming in Prisma relation fields.

## Relation Rules

- Do not add PascalCase relation fields like `Membership`, `Note`, `LogEntry`.
- Derive simple list names from the related model and pluralize: `Note[]` -> `notes`, `NoteComment[]` -> `noteComments`.
- For multiple relations to the same model, use role names: `projectRecordsAuthored`, `uploadsCreated`.
- Add `@relation("RoleName")` only when Prisma needs disambiguation.
- `@relation("Name")` is only disambiguation, not the Prisma Client field name.
- Prefer readable names for join/assignment models: `categoryAssignments`, `navigationLinks`, `layerConfigs`.

## Audit Rules

- Strongly prefer `createdBy` and `updatedBy` relations on user-edited tables.
- If table changes need an audit trail beyond `createdBy` / `updatedBy`, use [`@explita/prisma-audit-log`](https://www.npmjs.com/package/@explita/prisma-audit-log) with audit context instead of inventing ad hoc log tables.

## Workflows

Adding schema: add singular model, camelCase scalars, `{name}Id` FK scalars, relation fields by cardinality, named relations for ambiguity, then run `bun prisma generate` or the app script.

Renaming relation fields: rename only in `schema.prisma`; no DB migration is needed for the rename itself. Regenerate Prisma Client, grep old names in `include`, `select`, `_count`, and nested writes, update TypeScript, then run checks.

## Related

- DB inspection: skill `tech-stack` -> `references/cursor-mcp.md`
- Better Auth adapter: skill `tanstack-start-auth`

## Sources

- [Prisma schema naming conventions](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#naming-conventions)
- [Prisma custom model and field names](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/custom-model-and-field-names)
