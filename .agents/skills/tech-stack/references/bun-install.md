# Bun install

Load for global store setup, Vite dev with globalStore, or phantom deps.

**Templates:** [bunfig.toml](../examples/bunfig.toml.template)

## Decisions (not in templates)

- Bun [≥ 1.3.14](https://bun.com/blog/bun-v1.3.14) — `rm -rf node_modules && bun install` after Bun or bunfig changes
- Commit `bunfig.toml` per repo ([template](../examples/bunfig.toml.template)); overrides `~/.bunfig.toml`
- Vite dev: extend [server.fs.allow](https://vite.dev/config/server-options.html#server-fs-allow) with `~/.bun/install/cache/links` (extend defaults — do not replace the project root) — do **not** disable globalStore first
- Explicit dep enforcement (your imports): [knip.md](knip.md)

## Phantom dependencies under `globalStore`

With [`globalStore = true`](https://bun.com/docs/pm/global-store), packages realpath into `~/.bun/install/cache/links/…`. From there, Node/TS **cannot** walk up into the project’s hidden hoist (`node_modules/.bun/node_modules/`). Only **declared** deps of that package are linked into its store entry.

Bun docs call out [phantom-dependency fallback](https://bun.com/docs/pm/global-store#phantom-dependency-fallback). Important distinction:

- **Who `require`s:** Your app code (or a config you own)  
  **Fix:** Add the missing module as a **direct** `package.json` dependency (and comment why). `publicHoistPattern` / top-level hoist helps **your** resolution only.
- **Who `require`s:** A third-party package inside `/links/` (e.g. `eslint-plugin-compat` → `caniuse-lite`)  
  **Fix:** Adding the helper as an **app** direct dep does **not** help. Prefer, in order: (1) upstream declare the dep, (2) `trustedDependencies` / `bun patch` so that package stays **project-local**, (3) `globalStore = false` as last resort.

### `trustedDependencies` (project-local carve-out)

List packages that must stay under `node_modules/.bun/<pkg>@…/` (real dir, not a symlink into `cache/links/`):

```json
{
  "trustedDependencies": ["eslint-plugin-compat"]
}
```

Also use this when TypeScript peer/lib resolution breaks because a type-shipping package lives in the global store (e.g. `bun-types` needing `undici-types` without DOM; UI libs whose `.d.ts` walk for `@types/react`). Keep the list **small** — each entry leaves the shared store.

After changing `trustedDependencies` or bunfig: `rm -rf node_modules && bun install`.

Verify: `realpath node_modules/<pkg>` should be under the **project** `node_modules/.bun/…`, not `~/.bun/install/cache/links/…`.

### Related upstream

- Bun (same resolution class): [oven-sh/bun#29614](https://github.com/oven-sh/bun/issues/29614)
- TS peers from global-store packages: [oven-sh/bun#29727](https://github.com/oven-sh/bun/issues/29727)
- `eslint-plugin-compat` missing `caniuse-lite`: [amilajack/eslint-plugin-compat#692](https://github.com/amilajack/eslint-plugin-compat/issues/692) — see [browser-target.md](browser-target.md)

## Pointers

- **Question:** Did global store work?  
  **See:** [bun-install-verify.md](bun-install-verify.md)
- **Question:** `ERR_LOAD_URL` / `cache/links`  
  **See:** [vitejs/vite#22662](https://github.com/vitejs/vite/issues/22662) · [server.fs.allow](https://vite.dev/config/server-options.html#server-fs-allow) (above)
- **Question:** compat / `caniuse-lite`  
  **See:** [browser-target.md](browser-target.md)

Bun docs: [global store](https://bun.com/docs/pm/global-store) · [minimumReleaseAge](https://bun.com/docs/runtime/bunfig#install-minimumreleaseage)
