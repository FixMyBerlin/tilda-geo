import type { MarkdownMailProps } from '../_templates/MarkdownMail'

type MailAddress = {
  Email: string
  Name?: string
}

export type Mail = {
  From: MailAddress
  To: MailAddress | MailAddress[]
  Subject: string
} & MarkdownMailProps

export type TransactionalMessage = {
  From: MailAddress
  To: MailAddress[]
  Subject: string
  TextPart: string
  HTMLPart: string
}
