import { todoIds } from '@/src/data/processingTypes/todoId.generated.const'

export const todoMarkdownToMaprouletteCampaignKey = (todos: string | undefined) => {
  return todoIds
    .map((project) => {
      if (todos?.includes(`* ${project}\n`)) {
        return project
      }
    })
    .filter(Boolean)
}
