import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'

const maprouletteChallengeId = z.object({ challengeId: z.coerce.number().positive() })

const maprouletteChallengeStatistic = z.array(
  z.strictObject({
    id: z.number(),
    name: z.string(),
    actions: z.object({
      total: z.number(),
      available: z.number(),
      fixed: z.number(),
      falsePositive: z.number(),
      skipped: z.number(),
      deleted: z.number(),
      alreadyFixed: z.number(),
      tooHard: z.number(),
      answered: z.number(),
      validated: z.number(),
      disabled: z.number(),
      avgTimeSpent: z.number(),
      tasksWithTime: z.number(),
    }),
  }),
)

export const Route = createFileRoute('/api/maproulette/statistic-proxy/$challengeId')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsedParams = maprouletteChallengeId.safeParse({
          challengeId: params.challengeId,
        })

        if (parsedParams.success === false) {
          return Response.json({ error: 'Invalid `challengeId`', parsedParams }, { status: 404 })
        }
        const { challengeId } = parsedParams.data

        // Note: `app/src/env.d.ts` types get overwritten by Bun gobal process.env types which include `undefined`
        const apiKey = process.env.MAPROULETTE_API_KEY
        if (!apiKey) {
          return Response.json(
            { error: 'MAPROULETTE_API_KEY not configured' },
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          )
        }

        try {
          const apiUrl = `https://maproulette.org/api/v2/data/challenge/${challengeId}`

          const response = await fetch(apiUrl, {
            cache: 'force-cache',
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              apiKey,
            },
          })
          const json = await response.json()
          const parsed = maprouletteChallengeStatistic.safeParse(json)

          const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          }
          if (parsed.success === false || !parsed.data[0]) {
            return Response.json(
              { error: 'Invalid response', parsed, json },
              { status: 500, headers: responseHeaders },
            )
          }

          return Response.json(parsed.data[0].actions, { headers: responseHeaders })
        } catch (error) {
          console.error(error)
          return Response.json(
            {
              error: 'Internal Server Error',
              info: isProd ? undefined : error,
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
