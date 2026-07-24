type ClampSkipTakeOptions = {
  defaultTake?: number
  maxTake?: number
}

export function clampSkipTake(
  skip: number | undefined,
  take: number | undefined,
  { defaultTake = 50, maxTake = 200 }: ClampSkipTakeOptions = {},
) {
  return {
    skip: Math.max(skip ?? 0, 0),
    take: Math.min(Math.max(take ?? defaultTake, 1), maxTake),
  }
}
