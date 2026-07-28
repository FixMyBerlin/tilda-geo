# topic-docs-coverage-check

Manual consistency check between:

- **generated inspector translations vs. topic-docs (generated YAML output)** — static, no DB required
- `(key, value)` pairs found in DB `tags`
- documented attributes/values from `topic-docs`
- generated inspector translations

## Generated translations vs. topic-docs YAML

After `bun run topic-docs-build`, the script verifies generated translation completeness for topic-doc sources (for example `${sourceId}--title`) and reports the generated key set for visibility.

- `app/src/data/generated/topicDocs/inspectorTranslations.gen.ts`
- plus synthetic `${sourceId}--title` entries from compiled table titles

| Category          | Meaning                                          | Default: check fails? |
| ----------------- | ------------------------------------------------ | --------------------- |
| **missingTitles** | sourceIds without generated `${sourceId}--title` | yes                   |
| **yamlOnlyKeys**  | key exists in generated YAML output              | no (info)             |

If this phase fails, the script exits with code 1 **before** opening a database connection.

## Topic-docs ↔ DB (`tags`): symmetric comparison

For each table with a topic-docs entry in `byTableName.gen.ts`, unique `(key, value)` pairs from `public.<table>.tags` (`jsonb_each_text`) are compared against compiled YAML attributes and (when present) enumerated values. The same exceptions as in code apply in both directions (for example `condition_category`, types without explicit value lists).

**In DB, not in docs**

- `extraDbKeysNotInDocs`: tag keys present in DB but not documented as YAML attributes.
- `missingDocValues`: `key=value` pairs present in DB where the value is not in the documented enum for that attribute.

**In docs, not in DB**

- `missingDocKeys`: documented attributes that never appear as tag keys in any row.
- `documentedValuesNotInDb`: `key=value` for enumerated YAML values never seen in DB, **if** that key appears at least once in tags (otherwise `missingDocKeys` is enough; no full enum listing when the key is absent).

`documentedValuesNotInDb` is **informational** and does **not** fail the check (rare OSM values, preemptive enums).

## Usage

From `app/`:

```sh
bun run topic-docs-build
bun run topic-docs-coverage-check -- --table parkings
```

Multiple tables:

```sh
bun run topic-docs-coverage-check -- --table parkings,parkings_cutouts
```

Write JSON report (intentionally **not** tracked in Git — generated from your DB, changes constantly):

```sh
bun run topic-docs-coverage-check -- --table parkings --out-json ./scripts/topic-docs-coverage-check/output/latest.json
```

Per-table markdown output (two sections: DB↔docs as above; filename `<tableName>.md`):

```sh
bun run topic-docs-coverage-check -- --report-dir ./scripts/topic-docs-coverage-check/output/reports
```

Structure: `generatedTranslations` (object with `missingTitles`, `yamlOnlyKeys`) and `dbCoverage` (array per `tableName` including `extraDbKeysNotInDocs`, `missingDocKeys`, `documentedValuesNotInDb`, `missingDocValues`, `typeMismatches`, `missingInspectorKeys`, `missingInspectorValues`). If the translation phase fails, `dbCoverage` is `null` and only `generatedTranslations` is written; `--report-dir` is skipped in that case.

The folder `scripts/topic-docs-coverage-check/output/` is ignored via `.gitignore`.

Database: same config as the app — `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` in repo-root `.env` (see `.env.example`). Alternatively via SSH tunnel with `--source staging` or `--source production` (`DATABASE_URL_STAGING` / `DATABASE_URL_PRODUCTION`) or `--database-url`.
