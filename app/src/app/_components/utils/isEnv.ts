export const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production'

export const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging'

export const isDev =
  process.env.NEXT_PUBLIC_APP_ENV === 'development' && process.env.NODE_ENV === 'development'

export const isTest = process.env.NODE_ENV === 'test'

export const isBrowser = typeof window !== 'undefined'

export const envKey = process.env.NEXT_PUBLIC_APP_ENV
