import { BrevoClient } from '@getbrevo/brevo'
import { render } from 'react-email'
import { footerTextMarkdown } from '../_templates/footerTextMarkdown'
import { MarkdownMail } from '../_templates/MarkdownMail'
import { signatureTextMarkdown } from '../_templates/signatureTextMarkdown'
import { getBrevoApiKeyForSending } from './getBrevoApiKeyForSending'
import type { Mail, TransactionalMessage } from './types'

const appEnv = process.env.VITE_APP_ENV
const isTest = process.env.NODE_ENV === 'test'
const isDev = process.env.NODE_ENV === 'development' || appEnv === 'development'

/**
 * Centralized email sending helper
 * - In development: Previews email in browser
 * - In staging/production: Sends email via Brevo
 *
 * Uses markdown format for both text and HTML parts
 */
export async function sendMail(message: Mail) {
  // Add standard signature and footer to TextPart only
  // (The HTMLPart puts this in separate layout groups.)
  const textPart = `
${message.introMarkdown}
${
  message.ctaLink && message.ctaText
    ? `

${message.ctaText}: ${message.ctaLink}

`
    : ''
}
${message.outroMarkdown ? message.outroMarkdown : ''}

${signatureTextMarkdown}

---
${footerTextMarkdown}
`

  const htmlPart = await render(<MarkdownMail {...message} />)

  const toArray = Array.isArray(message.To) ? message.To : [message.To]

  const transactionalMessage: TransactionalMessage = {
    From: message.From,
    To: toArray,
    Subject: message.Subject,
    TextPart: textPart,
    HTMLPart: htmlPart,
  }

  if (isTest || isDev) {
    // Preview email in the browser for development and tests
    const previewEmail = (await import('preview-email')).default
    const fromEmail = transactionalMessage.From.Email || ''
    const toEmail = transactionalMessage.To.map((to) => to.Email || '').join(';')

    await previewEmail(
      {
        from: fromEmail,
        to: toEmail,
        subject: transactionalMessage.Subject,
        text: transactionalMessage.TextPart,
        html: transactionalMessage.HTMLPart,
      },
      { openSimulator: false },
    )
    return
  }

  // === Only on Staging, Production ===
  // Send email via Brevo transactional API
  const brevo = new BrevoClient({
    apiKey: getBrevoApiKeyForSending(),
  })
  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      email: transactionalMessage.From.Email,
      name: transactionalMessage.From.Name,
    },
    to: transactionalMessage.To.map(({ Email, Name }) => ({ email: Email, name: Name })),
    subject: transactionalMessage.Subject,
    textContent: transactionalMessage.TextPart,
    htmlContent: transactionalMessage.HTMLPart,
  })
  return result
}
