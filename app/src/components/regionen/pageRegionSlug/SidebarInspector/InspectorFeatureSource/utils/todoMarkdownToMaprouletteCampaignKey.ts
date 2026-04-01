import { todoIds } from '@/data/processingTypes/todoId.generated.const'

export const todoMarkdownToMaprouletteCampaignKey = (todos: string | undefined) => {
  return todoIds.filter((project) => todos?.includes(`* ${project}\n`))
}
