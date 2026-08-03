# Region map URL state (`config` + `v`)

Shareable region URLs encode which map layers are on or off in the `config` search param. Old bookmarks are upgraded automatically when someone opens the link.

## Where normalization happens

On first load (region slug change), the region route **loader** calls [`getRegionRedirectUrl.server.ts`](../../../../../../server/regions/getRegionRedirectUrl.server.ts) via `getRegionPageDataFn`. That function:

1. Runs versioned URL migrations (`migrateUrl`)
2. Drops unknown search params
3. Validates or resets `map` and `config`

Invalid or unmigratable values fall back to the region’s defaults (fresh layer config + region map center). A bad `v` value throws instead of silently resetting.

The loader redirect is intentional: client-only param changes (panning, toggling layers) must **not** re-hit the server on every navigation.

## Version param `v`

- Current version: **2** (see [`migrations/`](./migrations/)).
- Missing `v` is treated as **0** and migrations run up to the current version.
- After migration, `v` is set to the current version.
- Migrations can touch any registered search param (e.g. v1 renames old `config` ids and merges `lat`/`lng`/`zoom` into `map`).

Registry completeness is tested in [`migrations/index.test.ts`](./migrations/index.test.ts).

## `config` param (v2)

Short form: `config=1oy2q4i.jz9kth.bqcg3k.f4`

Two dot-separated parts:

| Part              | Example            | Meaning                                                          |
| ----------------- | ------------------ | ---------------------------------------------------------------- |
| 1 — checksum      | `1oy2q4i`          | Which category/subcategory/style **tree** this URL was built for |
| 2+ — bit segments | `jz9kth.bqcg3k.f4` | Which nodes are **active** (`true`/`false`), in template order   |

Encode/decode: [`v2/serialize.ts`](./v2/serialize.ts), [`v2/parse.ts`](./v2/parse.ts). Checksum algorithm: [`v2/lib.ts`](./v2/lib.ts).

Templates are simplified trees from [`simplifyConfigForParams`](./utils/simplifyConfigForParams.ts), derived from the region’s category list and [`categories.const.ts`](../../../mapData/mapDataCategories/categories.const.ts). Historical checksums live in `RegionConfigTemplate` (upserted on every region save).

Template `active` defaults in part 1 are **not** used at decode time — part 2 overwrites them, then [`mergeCategoriesConfig`](./utils/mergeCategoriesConfig.ts) merges with the region’s fresh defaults.

### Resolving a checksum (part 1)

When decoding an old URL, [`resolveConfigTemplate`](../../../../../../server/regions/regionConfigTemplates.server.ts) looks up the checksum in order:

1. **Current region categories** — rebuild template if checksum matches today’s list (no DB read)
2. **`RegionConfigTemplate` (DB)** — upserted on every region save when categories change

If nothing matches, `config` resets to the region’s fresh defaults.

## Client hook

[`useCategoriesConfig`](./useCategoriesConfig.ts) reads/writes `?config=` on the client. It assumes the loader has already normalized the param — if the checksum matches the current region, it parses; otherwise it uses fresh defaults.

## Invariant

`validateSearch` (`regionSearchSchema`) and `useCategoriesConfig` assume `?config=` was already normalized by `getRegionRedirectUrl` in the region loader. Do not render the region map route without that step.
