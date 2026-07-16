# Bun install

Load for global store setup, Vite dev with globalStore, or phantom deps.

**Templates:** [bunfig.toml](../examples/bunfig.toml.template)

## Decisions (not in templates)

- Bun [≥ 1.3.14](https://bun.com/blog/bun-v1.3.14) — `rm -rf node_modules && bun install` after Bun or bunfig changes
- Commit `bunfig.toml` per repo ([template](../examples/bunfig.toml.template)); overrides `~/.bunfig.toml`
- Vite dev: extend [server.fs.allow](https://vite.dev/config/server-options.html#server-fs-allow) with `~/.bun/install/cache/links` (extend defaults — do not replace the project root) — do **not** disable globalStore first
- [Phantom deps](https://bun.com/docs/pm/global-store#phantom-dependency-fallback): direct `package.json` entry + comment in vite/astro config explaining why
- Explicit dep enforcement (your imports): [knip.md](knip.md)

## Pointers

| Question                       | See                                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Did global store work?         | [bun-install-verify.md](bun-install-verify.md)                                                                                                            |
| `ERR_LOAD_URL` / `cache/links` | [vitejs/vite#22662](https://github.com/vitejs/vite/issues/22662) · [server.fs.allow](https://vite.dev/config/server-options.html#server-fs-allow) (above) |
| compat / `caniuse-lite`        | [browser-target.md](browser-target.md)                                                                                                                    |

Bun docs: [global store](https://bun.com/docs/pm/global-store) · [minimumReleaseAge](https://bun.com/docs/runtime/bunfig#install-minimumreleaseage)
