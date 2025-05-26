import { todoKeys } from '@/src/data/processingTypes/todoKeys.const'

export const todoMarkdownToMaprouletteCampaignKey = (todos: string | undefined) => {
  return todoKeys
    .map((project) => {
      if (todos?.includes(`* ${project}\n`)) {
        return project
      }
    })
    .filter(Boolean)
}
