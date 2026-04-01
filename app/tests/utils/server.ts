import type { Page } from '@playwright/test'

type ServerError = {
  kind: 'requestfailed' | 'response'
  method?: string
  status?: number
  url: string
  details?: string
}

const KNOWN_ACCEPTABLE_SERVER_ERRORS: Array<string | RegExp> = []

function isAcceptableError(text: string) {
  return KNOWN_ACCEPTABLE_SERVER_ERRORS.some((pattern) => {
    if (typeof pattern === 'string') {
      return text.includes(pattern)
    }
    return pattern.test(text)
  })
}

function isSameOrigin(url: string, baseURL: string) {
  try {
    return new URL(url).origin === new URL(baseURL).origin
  } catch {
    return false
  }
}

export function collectServerErrors(page: Page, baseURL: string) {
  const errors: ServerError[] = []

  page.on('requestfailed', (request) => {
    const url = request.url()
    if (!isSameOrigin(url, baseURL)) return

    errors.push({
      kind: 'requestfailed',
      url,
      method: request.method(),
      details: request.failure()?.errorText,
    })
  })

  page.on('response', (response) => {
    const url = response.url()
    if (!isSameOrigin(url, baseURL)) return

    const status = response.status()
    if (status < 500) return

    errors.push({
      kind: 'response',
      url,
      method: response.request().method(),
      status,
      details: response.statusText(),
    })
  })

  return errors
}

export async function expectNoServerErrors(page: Page, errors: ServerError[]) {
  await page.waitForTimeout(500)

  const blockingErrors = errors.filter((error) => {
    const text = `${error.kind} ${error.method ?? 'UNKNOWN'} ${error.status ?? ''} ${error.url} ${error.details ?? ''}`
    return !isAcceptableError(text)
  })

  if (blockingErrors.length === 0) {
    return
  }

  const rendered = blockingErrors
    .map((error) => {
      return `${error.kind.toUpperCase()} ${error.method ?? 'UNKNOWN'} ${error.status ?? ''} ${error.url} ${error.details ?? ''}`.trim()
    })
    .join('\n')

  throw new Error(`Server errors found:\n${rendered}`)
}
