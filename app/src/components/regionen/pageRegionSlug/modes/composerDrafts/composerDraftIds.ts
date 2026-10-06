export const internalNewNoteDraftId = (regionSlug: string) =>
  `note:new:internal:${regionSlug}` as const

export const osmNewNoteDraftId = (regionSlug: string) => `note:new:osm:${regionSlug}` as const

export const noteCommentDraftId = (noteId: number | string) => `note:comment:${noteId}` as const

export const qaEvalDraftId = (regionSlug: string, configSlug: string, areaId: string) =>
  `qa:eval:${regionSlug}:${configSlug}:${areaId}` as const

export const reviewCommentDraftId = (entryId: number | string) =>
  `review:comment:${entryId}` as const
