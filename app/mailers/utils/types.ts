import type { SendEmailV3_1 } from 'node-mailjet'
import { MarkdownMailProps } from '../templates/MarkdownMail'

// Format: https://github.com/mailjet/mailjet-apiv3-nodejs?tab=readme-ov-file#send-email-example
export type Mail = {
  From: SendEmailV3_1.Body['Messages'][number]['From']
  To: SendEmailV3_1.Body['Messages'][number]['To']
  Subject: string
} & MarkdownMailProps

export type MailjetMessage = {
  From: SendEmailV3_1.Body['Messages'][number]['From']
  To: SendEmailV3_1.Body['Messages'][number]['To']
  Subject: string
  TextPart: string
  HTMLPart: string
}
