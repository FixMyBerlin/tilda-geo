import type { TodoId } from '@/data/processingTypes/todoId.generated.const'

const currentnessTodoIds = ['currentness_too_old', 'currentness_too_old__mapillary']

export const isCurrentnessId = (id: string | undefined) => !!id && currentnessTodoIds.includes(id)

/** Hide low-priority currentness todos when more specific todos are present. */
export const filterMaprouletteProjectKeys = (
  projectKeys: TodoId[],
  activeCampaignStyleId: string | undefined,
) => {
  // When the map filter is a currentness campaign, show all todos (user is focused on this campaign).
  if (isCurrentnessId(activeCampaignStyleId)) {
    return projectKeys
  }

  // When only currentness todos are present, show them (nothing more specific to prioritize).
  const hasNonCurrentnessTodo = projectKeys.some((key) => !isCurrentnessId(key))
  if (!hasNonCurrentnessTodo) {
    return projectKeys
  }

  // When other todos are present, hide currentness todos to keep the sidebar focused.
  return projectKeys.filter((key) => !isCurrentnessId(key))
}
