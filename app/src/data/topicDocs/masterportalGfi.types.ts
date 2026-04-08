/** Masterportal services.json `gfiAttributes` value shapes (labels, numbers, HTML). */

export type TopicDocGfiHtmlConfig = {
  tag: string
  innerHTML: string
  properties?: Record<string, string>
}

export type TopicDocGfiAttributeObject =
  | {
      name: string
      type: 'number'
      format?: string
      prefix?: string
      suffix?: string
    }
  | {
      name: string
      type: 'html'
      html: TopicDocGfiHtmlConfig
    }
  | {
      name: string
      condition: 'contains' | 'startsWith' | 'endsWith'
      type: 'string'
      format: Record<string, string>
    }

export type TopicDocGfiAttributeValue = string | TopicDocGfiAttributeObject

export type TopicDocMasterportalGfiConfig = {
  gfiAttributes: Record<string, TopicDocGfiAttributeValue>
}
