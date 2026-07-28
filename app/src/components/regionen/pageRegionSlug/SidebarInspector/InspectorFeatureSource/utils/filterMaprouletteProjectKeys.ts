import type { TodoId } from '@/data/processingTypes/todoId.generated.const'

const currentnessTodoIds = ['currentness_too_old', 'currentness_too_old__mapillary']
const mapillarySuffix = '__mapillary'

export const isCurrentnessId = (id: string | undefined) => !!id && currentnessTodoIds.includes(id)

const toMapillaryVariant = (projectKey: TodoId) => `${projectKey}${mapillarySuffix}` as TodoId

/** When base and mapillary campaign exist for the same group, keep only the mapillary variant. */
export const preferMapillaryCampaignVariants = (projectKeys: TodoId[]) => {
  const keySet = new Set(projectKeys)

  return projectKeys.filter((key) => {
    if (key.endsWith(mapillarySuffix)) return true
    return !keySet.has(toMapillaryVariant(key))
  })
}

/** Hide low-priority currentness todos when more specific todos are present. */
export const filterMaprouletteProjectKeys = (
  projectKeys: TodoId[],
  activeCampaignStyleId: string | undefined,
) => {
  const withoutMapillaryDuplicates = preferMapillaryCampaignVariants(projectKeys)

  // When the map filter is a currentness campaign, show all todos (user is focused on this campaign).
  if (isCurrentnessId(activeCampaignStyleId)) {
    return withoutMapillaryDuplicates
  }

  // When only currentness todos are present, show them (nothing more specific to prioritize).
  const hasNonCurrentnessTodo = withoutMapillaryDuplicates.some((key) => !isCurrentnessId(key))
  if (!hasNonCurrentnessTodo) {
    return withoutMapillaryDuplicates
  }

  // When other todos are present, hide currentness todos to keep the sidebar focused.
  return withoutMapillaryDuplicates.filter((key) => !isCurrentnessId(key))
}
