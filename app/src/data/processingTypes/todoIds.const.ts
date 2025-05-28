import {
  bikelaneTodoIdsTableAndField,
  bikelaneTodoIdsTableOnly,
  roadTodoIdsTableAndField,
  roadTodoIdsTableOnly,
} from './todoId.generated.const'

export const bikelaneTodoIds = [
  ...bikelaneTodoIdsTableAndField,
  ...bikelaneTodoIdsTableOnly,
] as const
export type BikelaneTodoId = (typeof bikelaneTodoIds)[number]

export const roadTodoIds = [
  ...roadTodoIdsTableAndField,
  ...roadTodoIdsTableOnly,
  // (prettier: one line per entry)
] as const

export const todoIds = [
  ...bikelaneTodoIds,
  ...roadTodoIds,
  // (prettier: one line per entry)
] as const
export type TodoId = (typeof todoIds)[number]

export const todoIdsTableOnly = [
  ...bikelaneTodoIdsTableOnly,
  ...roadTodoIdsTableOnly,
  // (prettier: one line per entry)
] as const
