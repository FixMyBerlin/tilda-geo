import type { getPlanningVariantFn } from '@/server/planning/planning.functions'

export type PlanningVariantDetail = Awaited<ReturnType<typeof getPlanningVariantFn>>
