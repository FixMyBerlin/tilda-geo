type UrlProtocol = 'http' | 'https'

export type UrlParts = {
  protocol: UrlProtocol
  host: string
  port?: number
}

export const makeOriginFromParts = ({ protocol, host, port }: UrlParts) => {
  if (!port) return `${protocol}://${host}`
  return `${protocol}://${host}:${port}`
}
