import { useInspectorMissingTranslationsEntries } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInspectorMissingTranslationsState'
import { useIsAdmin } from '@/components/shared/hooks/useIsAdmin'

export const ToolsMissingTranslations = () => {
  const isAdmin = useIsAdmin()

  if (!isAdmin) {
    return null
  }

  return <ToolsMissingTranslationsPanel />
}

const ToolsMissingTranslationsPanel = () => {
  const entries = useInspectorMissingTranslationsEntries()
  const count = entries.length

  if (count === 0) {
    return null
  }

  return (
    <section className="rounded-md border border-white/70 bg-pink-300 p-3 text-xs text-gray-900 shadow-xl">
      <details>
        <summary className="cursor-pointer font-semibold">Missing translations ({count})</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-pink-200 p-2 font-mono text-[11px] text-gray-900">
          {entries.map((entry) => entry.missing).join('\n')}
        </pre>
      </details>
    </section>
  )
}
