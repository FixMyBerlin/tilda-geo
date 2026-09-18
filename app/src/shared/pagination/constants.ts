/** Rows per page in admin lists and the default `take` for REST API / MCP list endpoints. */
export const ADMIN_DEFAULT_PAGE_SIZE = 50

/** Upper bound for `pageSize` (admin URLs) and `take` (REST API / MCP). */
export const MAX_PAGE_SIZE = 200

/** Upper bound for 1-based `?page=` on admin list URLs. Larger values fall back like other invalid input. */
export const MAX_PAGE = 10_000

/**
 * Upper bound for `skip` after clamping. Caps `(page - 1) * pageSize` and REST/MCP `skip` so a huge
 * offset never reaches Postgres.
 */
export const MAX_SKIP = MAX_PAGE * MAX_PAGE_SIZE
