import { z } from 'zod'

// const prioritySchema = z.object({
//   condition: z.literal('AND'),
//   rules: z.array(
//     z.object({ type: z.literal('string'), operator: z.literal('equal'), value: z.string() }),
//   ),
// })
const prioritySchema = z.string()

export const CreateMapRouletteChallengeSchema = z.strictObject({
  enabled: z.boolean(),
  checkinComment: z.string(), // "Verkehrszeichen ergänzet #osm_traffic_signs_project #missing_traffic_sign_244 #maproulette",
  checkinSource: z.string(), // "osm_traffic_signs_project",
  defaultBasemap: z.literal(-1), // -1,
  defaultBasemapId: z.literal(''), // "",
  description: z.string(), // Challenge Level
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]), // 2,
  instruction: z.string().refine((val) => val.replace(/\n/g, '').length >= 150, {
    message: 'Description must be at least 150 characters long',
  }), // Task Level
  defaultPriority: z.number(),
  highPriorityRule: prioritySchema,
  mediumPriorityRule: prioritySchema,
  lowPriorityRule: prioritySchema,
  name: z.string(), // "test",
  overpassTargetType: z.null(), // null,
  parent: z.number(), // 57664,
  remoteGeoJson: z.string().url(), // "https://tilda-geo.de/api/maproulette/missing_traffic_sign_244",
  tags: z.string(), // "highway",
  dataOriginDate: z.string().datetime(), // "2024-09-29T22:00:00.000Z",
  presets: z.array(z.string()), // [],
  taskStyles: z.array(z.string()), // [],
  infoLink: z.string().url(),
  taskWidgetLayout: z.any(),
})

export type CreateMapRouletteChallengeType = z.infer<typeof CreateMapRouletteChallengeSchema>

export const UpdateMapRouletteChallengeSchema = CreateMapRouletteChallengeSchema.extend({
  id: z.number(),
})

export type UpdateMapRouletteChallengeType = z.infer<typeof UpdateMapRouletteChallengeSchema>
