/**
 * Bun idle-timeout workaround for long “time-to-first-byte” handlers (FixMyBerlin/private-issues#3218).
 *
 * `Bun.serve` defaults to ~10s `idleTimeout`: a handler that sends no response bytes for that long gets its
 * connection closed (empty reply, or a 502 from Traefik). Nitro’s Bun preset does not expose a global
 * idle-timeout config, so slow routes opt in per request via `server.timeout(request, seconds)` on the
 * srvx/Bun request (`request.runtime.bun.server`, set by the Bun adapter). `0` disables the idle timeout.
 *
 * Routes that build a large response before the first byte (exports, warm-cache, data-schema import, MCP)
 * pass `0`: their duration depends on the data size. Traefik's timeouts in `docker-compose.network.yml`
 * limit only the client connection; the handler keeps running after Traefik gives up.
 */
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

export const extendBunRequestIdleTimeout = (request: Request, seconds: number) => {
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
