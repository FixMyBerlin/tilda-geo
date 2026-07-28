# Topic-Docs YAML Authoring Guide

This guide explains how to author `topic-docs` YAML files, which properties are allowed, and which combinations are valid.

Canonical validation and build logic:

- `app/src/data/topicDocs/schema.ts` (input schema and combination rules)
- `app/scripts/topic-docs-build/attributeResolution.ts` (cross-table refs and value resolution)

If this guide and code ever differ, the code is authoritative.

## File layout

`topic-docs/` uses three relevant file types:

- `groups.yml` (or `groups.yaml`): optional grouping for docs pages
- `<topic>/<tableName>.yaml`: one YAML document per table
- `<topic>/chapters/*.md`: chapter text referenced via `chapterRefs`

`tableName` is the YAML filename without extension. Example:

- `topic-docs/roads_bikelanes/bikelanes.yaml` -> table name `bikelanes`

## Table YAML shape

Each `<tableName>.yaml` file has this top-level structure:

```yaml
title: Human readable table title
summary: Optional short summary
sourceIds:
  - lua_table_name
attributes:
  - key: attribute_key
    label: Human readable label
```

Top-level keys:

- `title` (required): non-empty string
- `summary` (optional): non-empty string
- `sourceIds` (optional, default `[]`): list of non-empty strings
  - Each `sourceId` should match a Lua source/table identifier from processing output.
  - In almost all cases, use exactly one `sourceId` per file.
- `attributes` (required): non-empty list of attribute entries

Unknown top-level keys are rejected.

## Attribute property reference

Each `attributes[]` entry supports:

- `key` (required): non-empty string
- `format` (optional, default `string`):
  - `string`
  - `number`
  - `meter`
  - `kilometer`
  - `kilometer_per_hour`
  - `square_meter`
  - `percent`
  - `minutes`
  - `floors`
  - `population_label`
  - `date`
  - `sanitized_strings`
  - `ignore`
- `label` (conditionally required): non-empty string
- `description` (optional): non-empty string
- `chapterRefs` (optional): list of `{ chapterId: string }` (see [Chapter references](#chapter-references))
- `ref` (optional): pointer to another attribute using `<tableName>.<attributeKey>` (see [Pointer format and existence](#pointer-format-and-existence))
- `valuesRef` (optional): pointer to another attribute's value list using `<tableName>.<attributeKey>`
- `valuesAdd` (optional): extra values to append and de-duplicate by `value`
- `values` (optional): inline value list
- `purpose` (optional):
  - `experimentation`
  - `processing`
  - `qa`

Each value entry in `values` and `valuesAdd` supports:

- `value` (required): non-empty string
- `label` (required): non-empty string
- `description` (optional): non-empty string
- `chapterRefs` (optional): list of `{ chapterId: string }`

Unknown keys are rejected for both attributes and value nodes.

## Allowed combinations and constraints

These rules are enforced by schema validation and build-time resolution.

### Label rules

- `label` is required unless at least one of the following is true:
  - `ref` is set, or
  - `format: ignore` is used
- For `format: ignore` without `label`, the compiler falls back to `key` as label.

### Mutual exclusivity

- You cannot combine `values` and `valuesRef`.
- You cannot combine `ref` and `values`.
- You cannot combine `ref` and `valuesRef`.

### Dependency rules

- `valuesAdd` requires either `valuesRef` or `ref`.
- `format: ignore` forbids all of:
  - `values`
  - `valuesRef`
  - `valuesAdd`

### Pointer format and existence

For `ref` and `valuesRef`:

- Format must be exactly `<tableName>.<attributeKey>`.
- Target table must exist.
- Target attribute must exist in that table.

Additional `valuesRef` rule:

- The referenced attribute must contain `values`.

### Ref chaining and cycles

- `ref` may chain across multiple attributes.
- Resolution follows the chain to a terminal attribute.
- Circular `ref` chains are rejected.

### How values are resolved

No `ref`:

- `values` present -> use `values` (then merge `valuesAdd`)
- else `valuesRef` present -> reuse referenced values (then merge `valuesAdd`)
- else -> use only `valuesAdd` (if any)

With `ref`:

- Base metadata comes from the resolved terminal reference.
- Values come from the resolved terminal reference (including its own value reuse rules).
- Local `valuesAdd` is merged on top.

Merged values are de-duplicated by `value`, preserving first occurrence order.

## Reuse policy (no duplicate attributes)

Do not duplicate shared attribute definitions across many tables.

- Define canonical shared attributes once in a main/base table.
- In other tables, use `ref` to reuse full attribute metadata.
- Use `valuesRef` + `valuesAdd` only when you intentionally reuse enum values but need a table-specific label/description or a small extension.
- If you notice copied enums/labels across tables, refactor toward a single source definition.

## Chapter references

`chapterRefs` use objects with `chapterId`:

```yaml
chapterRefs:
  - chapterId: capacity-calculation
```

Chapter files live under `topic-docs/<topic>/chapters/*.md` and must start with YAML front matter:

```md
---
title: Chapter title
---

Chapter content...
```

Only `title` is allowed in chapter front matter.

## `groups.yml` shape

`topic-docs/groups.yml` (or `.yaml`) uses:

```yaml
groups:
  - id: atlas
    label: Optional group label
    tables:
      - roads
      - bikelanes
```

Rules:

- `id` required
- `label` optional
- `tables` optional, defaults to `[]`

## Valid examples

Basic attribute with inline enum values:

```yaml
attributes:
  - key: oneway
    label: Verkehrsrichtung
    values:
      - value: yes
        label: Eine Richtung
      - value: no
        label: Beide Richtungen
```

Attribute inheriting from another table:

```yaml
attributes:
  - key: length
    ref: roads.length
```

Reusing values and extending them:

```yaml
attributes:
  - key: surface_source
    label: Herkunft der Oberfläche
    valuesRef: roads.surface_source
    valuesAdd:
      - value: parent_highway_tag
        label: Von zugeordneter Straße (OSM)
```

## Where this data is used

Build step:

- `app/scripts/topic-docs-build/index.ts` compiles `topic-docs/*.yaml` into generated runtime files under `app/src/data/generated/topicDocs/`:
  - `byTableName.gen.ts`
  - `inspectorTranslations.gen.ts`
  - `inspectorDescriptions.gen.ts`
  - `masterportalByTableName.gen.ts`

Runtime access and consumers:

- `app/src/data/topicDocs/runtime.ts`
  - Loads generated files above and exposes lookups such as `getTopicDocByTableName`, `getMasterportalByTableName`, and inspector formatting/description helpers.
- Docs page route and components:
  - `app/src/routes/_pages/docs.$tableName.tsx`
  - `app/src/components/pages/docs/pageDocsTableName/PageDocsAttributesSection.tsx`
- Inspector translations/formatting:
  - `app/src/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const.ts` (uses `inspectorTranslations.gen.ts`)
  - `app/src/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/ConditionalFormattedValue.tsx`
  - `app/src/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/TagsTableRowValueWithTooltip.tsx`

## Verify your changes

From `app/`:

```sh
bun run topic-docs-build
```

Optional coverage check:

```sh
bun run topic-docs-coverage-check -- --table <tableName>
```

Coverage-check details: `app/scripts/topic-docs-coverage-check/README.md`.
