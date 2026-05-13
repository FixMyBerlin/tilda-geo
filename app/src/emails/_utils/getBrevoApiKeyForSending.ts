import { z } from 'zod'

const mailDeliveryEnvSchema = z.object({
  VITE_APP_ENV: z.enum(['staging', 'production']),
  BREVO_API_KEY: z.string().min(1),
})

export function getBrevoApiKeyForSending() {
  return mailDeliveryEnvSchema.parse(process.env).BREVO_API_KEY
}
