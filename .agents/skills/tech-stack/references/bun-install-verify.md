# Verify Bun global store

Load when the user asks whether isolated linker / global store is working.

Prerequisites: [bun-install.md](bun-install.md).

---

## Symlink layers

```text
node_modules/react  →  node_modules/.bun/react@19.2.7/node_modules/react          # isolated linker
node_modules/.bun/react@19.2.7  →  ~/.bun/install/cache/links/react@19.2.7-<hash>  # globalStore (1.3.14+)
```

---

## Looks wrong but is normal

- **Observation:** `@scope/` folders at `node_modules/@scope/`  
  **Verdict:** Normal — symlinks are inside the scope folder, not on the folder itself.
- **Observation:** Some `.bun/*` are real directories  
  **Verdict:** Expected — [ineligible packages](https://bun.com/docs/pm/global-store#what-stays-project-local) (patches, `trustedDependencies`, workspace / `file:` / `link:`).
- **Observation:** Large `node_modules`  
  **Verdict:** Expected with heavy graphs.

`trustedDependencies` / phantom fixes: [bun-install.md](bun-install.md#phantom-dependencies-under-globalstore).

---

## Diagnostics

From the Bun package root:

```bash
bun --version
rg 'linker|globalStore' bunfig.toml ~/.bunfig.toml 2>/dev/null
readlink node_modules/.bun/<pkg>@<ver>   # eligible → .../cache/links/...
find node_modules/.bun -maxdepth 1 -type l | wc -l
ls ~/.bun/install/cache/links/ | wc -l
```

---

## Not working

- **Cause:** Bun < 1.3.14  
  **Fix:** [bun upgrade](https://bun.sh); reinstall.
- **Cause:** Install before config/Bun change  
  **Fix:** `rm -rf node_modules && bun install`.
- **Cause:** `globalStore = false` or `linker = "hoisted"` in project bunfig  
  **Fix:** [bunfig template](../examples/bunfig.toml.template).
- **Cause:** No `node_modules/.bun/`  
  **Fix:** Need isolated linker + reinstall.
- **Cause:** `Cannot find module '…'` from a package under `cache/links/`  
  **Fix:** Phantom dep — [bun-install.md](bun-install.md#phantom-dependencies-under-globalstore). Do **not** only add the missing module as an app direct dep.
- **Cause:** Trusted package still realpaths into `cache/links/`  
  **Fix:** Confirm `trustedDependencies` in the **same** package’s `package.json`; reinstall.

**Smoke test:** [bunfig.toml.template](../examples/bunfig.toml.template) + `slugify` in a temp dir → `readlink node_modules/.bun/slugify@…` should hit `cache/links/`.

**Vite `ERR_LOAD_URL` but symlinks OK:** [bun-install.md](bun-install.md).
