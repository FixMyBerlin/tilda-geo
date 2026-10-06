---
name: topic-docs-yaml-authoring
description: Author and review `topic-docs` YAML files with valid field combinations, refs, and value reuse patterns. Use when creating or editing `topic-docs/*.yaml`, `topic-docs/groups.yml`, or chapter references.
disable-model-invocation: true
---

# Topic-Docs YAML Authoring

Use this skill when adding or editing topic-docs YAML.

## Primary reference

- Read `topic-docs/README.md` first.

## Source of truth for edge cases

If anything is unclear or conflicting, follow code validation/build behavior in:

- `app/src/data/topicDocs/schema.ts`
- `app/scripts/topic-docs-build/attributeResolution.ts`

## Authoring workflow

1. Identify the target table file in `topic-docs/<topic>/<tableName>.yaml`.
2. Apply the field and combination rules from `topic-docs/README.md`.
3. For `ref` and `valuesRef`, ensure pointers use `<tableName>.<attributeKey>` and targets exist.
4. Keep docs human-readable (`label`/`description`) unless `format: ignore` is intentional.
5. Verify changes from `app/`:
   - `bun run topic-docs-build`
   - Optional: `bun run topic-docs-coverage-check -- --table <tableName>`

## Required checks

- No invalid combinations (`ref` with `values`, `valuesRef` with `values`, etc.).
- `valuesAdd` only used with `ref` or `valuesRef`.
- `format: ignore` does not define values.
- Chapter references point to real chapter IDs.

## Output expectations

- Keep YAML minimal and explicit.
- Prefer reuse (`ref`/`valuesRef`) over copy-pasting large repeated enums.
