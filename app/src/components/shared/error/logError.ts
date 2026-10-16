import { createIsomorphicFn } from '@tanstack/react-start'

type LogErrorContext = string | { componentStack?: string }

export const logError = createIsomorphicFn()
  .server((error: unknown, context?: LogErrorContext) => {
    console.error('[SERVER ERROR]', context ?? '', error)
  })
  .client((error: unknown, context?: LogErrorContext) => {
    console.error('[CLIENT ERROR]', context ?? '', error)
  })
