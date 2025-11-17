import { isDev, isTest } from '@/src/app/_components/utils/isEnv'
import { render } from '@react-email/components'
import Mailjet, { LibraryResponse, type SendEmailV3_1 } from 'node-mailjet'
import { footerTextMarkdown } from '../templates/footerTextMarkdown'
import { MarkdownMail } from '../templates/MarkdownMail'
import { signatureTextMarkdown } from '../templates/signatureTextMarkdown'
import { Mail, MailjetMessage } from './types'

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
    To: toArray as SendEmailV3_1.Body['Messages'][number]['To'],
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

    await previewEmail({
      from: fromEmail,
      to: toEmail,
      subject: mailjetMessage.Subject,
      text: mailjetMessage.TextPart,
      html: mailjetMessage.HTMLPart,
    })
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
