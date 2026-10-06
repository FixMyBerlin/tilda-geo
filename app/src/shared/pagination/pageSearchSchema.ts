import { z } from 'zod'
import { ADMIN_DEFAULT_PAGE_SIZE, MAX_PAGE, MAX_PAGE_SIZE } from './constants'

/** Search values that `stripSearchParams(pageSearchDefaults)` keeps out of admin list URLs. */
export const pageSearchDefaults = { page: 1, pageSize: ADMIN_DEFAULT_PAGE_SIZE } as const

/**
 * 1-based `?page=` / `?pageSize=` for admin list routes. Invalid values fall back to the defaults
 * instead of throwing, so a hand-edited URL never crashes the page. REST API / MCP keep `skip`/`take`
 * (`offsetSearchFields`).
 */
export const createPageSearchSchema = () =>
  z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE)
      .default(pageSearchDefaults.page)
      .catch(pageSearchDefaults.page),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(pageSearchDefaults.pageSize)
      .catch(pageSearchDefaults.pageSize),
  })
