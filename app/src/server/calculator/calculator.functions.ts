import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import type { z } from 'zod'
import { CalculatorSumsSchema, getCalculatorSums } from './queries/getCalculatorSums.server'

// POST: drawn areas can be longer than a query string should be.
export const getCalculatorSumsFn = createServerFn({ method: 'POST' })
  .validator((data: z.infer<typeof CalculatorSumsSchema>) => CalculatorSumsSchema.parse(data))
  .handler(async ({ data }) => getCalculatorSums(data, getRequestHeaders()))
