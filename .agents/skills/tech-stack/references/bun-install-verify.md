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

| Observation                                 | Verdict                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@scope/` folders at `node_modules/@scope/` | Normal — symlinks are inside, not on the folder                                      |
| Some `.bun/*` are real directories          | [Ineligible packages](https://bun.com/docs/pm/global-store#what-stays-project-local) |
| Large `node_modules`                        | Expected with heavy graphs                                                           |

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

| Cause                                                           | Fix                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------- |
| Bun < 1.3.14                                                    | [bun upgrade](https://bun.sh); reinstall                |
| Install before config/Bun change                                | `rm -rf node_modules && bun install`                    |
| `globalStore = false` or `linker = "hoisted"` in project bunfig | Fix [bunfig template](../examples/bunfig.toml.template) |
| No `node_modules/.bun/`                                         | Need isolated linker + reinstall                        |

**Smoke test:** [bunfig.toml.template](../examples/bunfig.toml.template) + `slugify` in a temp dir → `readlink node_modules/.bun/slugify@…` should hit `cache/links/`.

**Vite `ERR_LOAD_URL` but symlinks OK:** [bun-install.md](bun-install.md).
