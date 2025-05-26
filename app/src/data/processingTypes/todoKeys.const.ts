import {
  bikelaneTodoKeysTableAndField,
  bikelaneTodoKeysTableOnly,
  roadTodoKeysTableAndField,
  roadTodoKeysTableOnly,
} from './todoKeys.generated.const'

export const bikelaneTodoKeys = [
  ...bikelaneTodoKeysTableAndField,
  ...bikelaneTodoKeysTableOnly,
] as const
export type BikelaneTodoId = (typeof bikelaneTodoKeys)[number]

export const roadTodoKeys = [...roadTodoKeysTableAndField, ...roadTodoKeysTableOnly] as const
export type RoadTodoKey = (typeof roadTodoKeys)[number]

export const todoKeys = [...bikelaneTodoKeys, ...roadTodoKeys] as const
export type TodoKey = (typeof todoKeys)[number]

export const todoKeysTableOnly = [...roadTodoKeysTableOnly, ...bikelaneTodoKeysTableOnly] as const
