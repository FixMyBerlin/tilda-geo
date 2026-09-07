import { createFileRoute } from '@tanstack/react-router'

/**
 * Default map mode (classic region map). The map and shared region data live on the parent layout
 * route, so this index adds no loader. It exists so the default mode has no mode panel. Mode-specific
 * data loading lives on the mode routes (e.g. QA preload in `qa.tsx`).
 */
export const Route = createFileRoute('/regionen/$regionSlug/')({
  ssr: 'data-only',
})
