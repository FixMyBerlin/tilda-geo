/**
 * Bun idle-timeout workaround for long “time-to-first-byte” handlers (FixMyBerlin/private-issues#3218).
 *
 * Symptom: large `/api/export/...` requests (e.g. Deutschland `bikelanes`) logged `start export` but never
 * `prepared export`; clients saw empty replies (~12s), Traefik 502 (~34s), or broken Chrome downloads.
 * Generation via ogr2ogr was fine — the HTTP connection was closed while the handler sent zero bytes.
 *
 * Cause: `Bun.serve` defaults to ~10s `idleTimeout` (no response bytes = idle). Nitro’s Bun preset does not
 * expose a global idle-timeout config; a compose `NITRO_BUN_IDLE_TIMEOUT` env var would not reach Bun.
 *
 * Fix: opt in per route via `server.timeout(request, seconds)` on the srvx/Bun request
 * (`request.runtime.bun.server`, set by the Bun adapter). Tune `EXPORT_IDLE_TIMEOUT_SECONDS` below.
 * Other slow routes (e.g. warm-cache) can call this with a higher value or `0` to disable.
 */
const EXPORT_IDLE_TIMEOUT_SECONDS = 120

type BunServerWithTimeout = {
  timeout: (request: Request, seconds: number) => void
}

type RequestWithBunRuntime = Request & {
  runtime?: {
    bun?: {
      server?: BunServerWithTimeout
    }
  }
}

export const extendBunRequestIdleTimeout = (
  request: Request,
  seconds = EXPORT_IDLE_TIMEOUT_SECONDS,
) => {
  const server = (request as RequestWithBunRuntime).runtime?.bun?.server
  if (!server?.timeout) return

  // Never let extending the timeout break the handler: server.timeout throws for a
  // request Bun no longer tracks (rewrapped/completed) and is a no-op outside Bun.
  try {
    server.timeout(request, seconds)
  } catch {
    // ignore: the request keeps Bun's default idle timeout
  }
}
