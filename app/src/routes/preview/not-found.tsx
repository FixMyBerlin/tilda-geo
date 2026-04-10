import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/preview/not-found')({
  ssr: true,
  loader: () => {
    throw notFound()
  },
  component: () => null,
})
