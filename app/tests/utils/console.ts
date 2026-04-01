import type { Page } from '@playwright/test'

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warning' | 'info' | 'debug'
  text: string
  timestamp: number
}

const KNOWN_ACCEPTABLE_ERRORS: Array<string | RegExp> = []

export function collectConsoleErrors(page: Page) {
  const messages: ConsoleMessage[] = []

  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      messages.push({
        type,
        text: msg.text(),
        timestamp: Date.now(),
      })
    }
  })

  return messages
}

export function filterAcceptableErrors(messages: ConsoleMessage[]) {
  return messages.filter((msg) => {
    return !KNOWN_ACCEPTABLE_ERRORS.some((pattern) => {
      if (typeof pattern === 'string') {
        return msg.text.includes(pattern)
      }
      if (pattern instanceof RegExp) {
        return pattern.test(msg.text)
      }
      return false
    })
  })
}

export async function expectNoConsoleErrors(page: Page) {
  const errors: ConsoleMessage[] = []
  const warnings: ConsoleMessage[] = []

  page.on('console', (msg) => {
    const type = msg.type()
    const text = msg.text()

    if (type === 'error') {
      errors.push({
        type: 'error',
        text,
        timestamp: Date.now(),
      })
    } else if (type === 'warning') {
      warnings.push({
        type: 'warning',
        text,
        timestamp: Date.now(),
      })
    }
  })

  await page.waitForTimeout(1000)

  const filteredErrors = filterAcceptableErrors(errors)
  const filteredWarnings = filterAcceptableErrors(warnings)

  if (filteredErrors.length > 0) {
    throw new Error(`Console errors found:\n${filteredErrors.map((e) => e.text).join('\n')}`)
  }

  if (filteredWarnings.length > 0) {
    console.warn(`Console warnings found:\n${filteredWarnings.map((w) => w.text).join('\n')}`)
  }
}
