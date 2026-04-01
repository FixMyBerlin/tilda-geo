export const isProd = import.meta.env.VITE_APP_ENV === 'production'

export const isStaging = import.meta.env.VITE_APP_ENV === 'staging'

export const isDev = import.meta.env.DEV

export const isTest = import.meta.env.MODE === 'test'

export const isBrowser = typeof window !== 'undefined'

export const envKey = import.meta.env.VITE_APP_ENV
