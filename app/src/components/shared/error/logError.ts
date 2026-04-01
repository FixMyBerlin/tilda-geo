import { createIsomorphicFn } from '@tanstack/react-start'

type LogErrorContext = string | { componentStack?: string }

export const logError = createIsomorphicFn()
  .server((error: Error, context?: LogErrorContext) => {
    console.error('[SERVER ERROR]', context ?? '', error)
  })
  .client((error: Error, context?: LogErrorContext) => {
    console.error('[CLIENT ERROR]', context ?? '', error)
  })
