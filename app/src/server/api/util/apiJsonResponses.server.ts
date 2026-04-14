import { isProd } from '@/components/shared/utils/isEnv'

export const apiJsonMessages = {
  notAuthenticated: 'Not authenticated',
  accessDenied: 'Access denied',
  notFound: 'Not found',
  unexpectedError: 'An unexpected error occurred',
  adminAccessRequired: 'Admin access required',
  invalidInput: 'Invalid input',
} as const

type HeadersField = {
  headers?: HeadersInit
}

export function unauthorizedJson(options: HeadersField = {}) {
  const { headers } = options
  return Response.json(
    { statusText: 'Unauthorized', message: apiJsonMessages.notAuthenticated },
    { status: 401, headers },
  )
}

export function forbiddenJson(options: HeadersField = {}) {
  const { headers } = options
  return Response.json(
    { statusText: 'Forbidden', message: apiJsonMessages.accessDenied },
    { status: 403, headers },
  )
}

export function notFoundJson(options: HeadersField & { message?: string } = {}) {
  const { headers, message } = options
  return Response.json(
    { statusText: 'Not Found', message: message ?? apiJsonMessages.notFound },
    { status: 404, headers },
  )
}

export function badRequestJson(options: HeadersField & { message?: string; info?: unknown } = {}) {
  const { headers, message, info } = options
  const body: Record<string, unknown> = {
    statusText: 'Bad Request',
    message: message ?? apiJsonMessages.invalidInput,
  }
  if (info !== undefined) {
    body.info = info
  }
  return Response.json(body, { status: 400, headers })
}

export function internalServerErrorJson(
  options: HeadersField & { message?: string; cause?: unknown } = {},
) {
  const { headers, message, cause } = options
  const body: Record<string, unknown> = {
    statusText: 'Internal Server Error',
    message: message ?? apiJsonMessages.unexpectedError,
  }
  if (!isProd && cause !== undefined) {
    body.info = cause
  }
  return Response.json(body, { status: 500, headers })
}
