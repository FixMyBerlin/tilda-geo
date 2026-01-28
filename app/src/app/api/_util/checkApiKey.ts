import { z } from 'zod'
import { isDev, isStaging } from '../../_components/utils/isEnv'

type ParseDataResult<T extends z.ZodTypeAny> =
  | { ok: true; data: z.infer<T>; errorResponse: null }
  | { ok: false; data: null; errorResponse: Response }

export const parseData = <T extends z.ZodTypeAny>(body: unknown, Schema: T): ParseDataResult<T> => {
  try {
    const data = Schema.parse(body)
    return { ok: true, data, errorResponse: null }
  } catch (e) {
    const responseData: Record<string, any> = { statusText: 'Bad Request' }
    if (isDev || isStaging) {
      responseData.error = e
    }
    return {
      ok: false,
      data: null,
      errorResponse: Response.json(responseData, { status: 400 }),
    }
  }
}

export const checkApiKey = (data: Request | Record<string, any>) => {
  if (process.env.NODE_ENV === 'development') {
    return { ok: true as const, errorResponse: null }
  }

  let apiKey: string | null
  if (data instanceof Request) {
    apiKey = new URL(data.url).searchParams.get('apiKey')
  } else if ('apiKey' in data) {
    apiKey = data.apiKey
  } else {
    apiKey = null
  }

  if (apiKey === process.env.ATLAS_API_KEY) {
    return { ok: true as const, errorResponse: null }
  } else {
    return {
      ok: false as const,
      errorResponse: Response.json({ statusText: 'Unauthorized' }, { status: 401 }),
    }
  }
}
