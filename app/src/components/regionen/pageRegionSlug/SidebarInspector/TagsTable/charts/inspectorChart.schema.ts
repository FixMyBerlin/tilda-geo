import { z } from 'zod'

/** The key of the chart is a property with shares as text: `47 % Radweg; 41 % Schutzstreifen`. */
const shareBarChartSchema = z.object({
  type: z.literal('shareBar'),
  colors: z.record(z.string(), z.string()),
  fallbackColor: z.string().optional(),
  /** @desc Translates the values like the values of this key, e.g. `fuehr` for `fuehr=Radweg` */
  translationKey: z.string().optional(),
})

/** The key of the chart is no property, so it has to be listed in `documentedKeys`. */
const pieChartSchema = z.object({
  type: z.literal('pie'),
  slices: z.array(z.object({ key: z.string(), label: z.string(), color: z.string() })),
  unit: z.string().optional(),
})

const inspectorChartSchema = z.discriminatedUnion('type', [shareBarChartSchema, pieChartSchema])
export const inspectorChartsSchema = z.record(z.string(), inspectorChartSchema)

export type InspectorChart = z.infer<typeof inspectorChartSchema>
export type InspectorShareBarChart = z.infer<typeof shareBarChartSchema>
export type InspectorPieChart = z.infer<typeof pieChartSchema>
export type InspectorCharts = z.infer<typeof inspectorChartsSchema>
