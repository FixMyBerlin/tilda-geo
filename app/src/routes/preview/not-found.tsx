import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/preview/not-found')({
  ssr: true,
  head: () => ({
    meta: [{ title: '404-Vorschau – TILDA' }],
  }),
  loader: () => {
    throw notFound()
  },
  component: () => null,
})
