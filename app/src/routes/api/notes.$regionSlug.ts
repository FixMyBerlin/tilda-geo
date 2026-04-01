import { createFileRoute } from '@tanstack/react-router'

/** Layout route for /api/notes/$regionSlug; only the /download child is used. */
export const Route = createFileRoute('/api/notes/$regionSlug')({})
