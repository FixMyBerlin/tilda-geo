import { ADMIN_DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MAX_SKIP } from './constants'

type ClampSkipTakeOptions = {
  defaultTake?: number
  maxTake?: number
}

function clampFinite(value: number | undefined, fallback: number, min: number, max: number) {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.floor(value), min), max)
}

export function clampSkipTake(
  skip: number | undefined,
  take: number | undefined,
  { defaultTake = ADMIN_DEFAULT_PAGE_SIZE, maxTake = MAX_PAGE_SIZE }: ClampSkipTakeOptions = {},
) {
  return {
    skip: clampFinite(skip, 0, 0, MAX_SKIP),
    take: clampFinite(take, defaultTake, 1, maxTake),
  }
}

/** `skip` of the last page, for requests past the end of a list (0 when the list is empty). */
export function lastPageSkip(total: number, take: number) {
  if (total <= 0) return 0
  return Math.floor((total - 1) / take) * take
}
