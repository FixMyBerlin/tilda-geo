import type { LibraryResponse, SendEmailV3_1 } from 'node-mailjet'
import Mailjet from 'node-mailjet'
import { render } from 'react-email'
import { footerTextMarkdown } from '../_templates/footerTextMarkdown'
import { MarkdownMail } from '../_templates/MarkdownMail'
import { signatureTextMarkdown } from '../_templates/signatureTextMarkdown'
import type { Mail, MailjetMessage } from './types'

const appEnv = process.env.VITE_APP_ENV
const isTest = process.env.NODE_ENV === 'test'
const isDev = process.env.NODE_ENV === 'development' || appEnv === 'development'

/**
 * Centralized email sending helper
 * - In development: Previews email in browser
 * - In staging/production: Sends email via Mailjet
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

  // Ensure To is always an array for MailjetMessage
  // Mail.To can be string | EmailAddressTo | (string | EmailAddressTo)[] | undefined
  const toValue = message.To ?? []
  const toArray = Array.isArray(toValue) ? toValue : [toValue]

  const mailjetMessage: MailjetMessage = {
    From: message.From,
    To: toArray,
    Subject: message.Subject,
    TextPart: textPart,
    HTMLPart: htmlPart,
  }

  if (isTest || isDev) {
    // Preview email in the browser for development and tests
    const previewEmail = (await import('preview-email')).default
    const fromEmail =
      typeof mailjetMessage.From === 'string'
        ? mailjetMessage.From
        : mailjetMessage.From?.Email || ''
    const toEmail = mailjetMessage.To.map((to) =>
      typeof to === 'string' ? to : to.Email || '',
    ).join(';')

    await previewEmail(
      {
        from: fromEmail,
        to: toEmail,
        subject: mailjetMessage.Subject,
        text: mailjetMessage.TextPart,
        html: mailjetMessage.HTMLPart,
      },
      { openSimulator: false },
    )
    return
  }

  // === Only on Staging, Production ===
  // Send email via Mailjet
  const data = { Messages: [{ ...mailjetMessage }] }
  const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_APIKEY_PUBLIC || '',
    process.env.MAILJET_APIKEY_PRIVATE || '',
  )
  const result: LibraryResponse<SendEmailV3_1.Response> = await mailjet
    .post('send', { version: 'v3.1' })
    .request(data)
  return result
}
