import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Disclosure } from '@/components/regionen/pageRegionSlug/SidebarInspector/Disclosure/Disclosure'
import {
  adminPrivateHookUiItems,
  type PrivateHookSlug,
  triggerPrivateHookAdminFn,
} from '@/server/admin/adminPrivateHooks.functions'

const cardClassName = twMerge(
  'not-prose divide-y divide-gray-900/10 overflow-hidden',
  'rounded-xl bg-white/90 shadow-sm ring-1 ring-gray-900/5',
)

const triggerButtonClassName = twMerge(
  'shrink-0 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm',
  'hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50',
)

export function AdminPrivateHooksSection() {
  const [loadingSlug, setLoadingSlug] = useState<PrivateHookSlug | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleTrigger(slug: PrivateHookSlug) {
    setFeedback(null)
    setLoadingSlug(slug)
    try {
      const result = await triggerPrivateHookAdminFn({ data: { slug } })
      if (result.ok) {
        setFeedback(`${result.message} (HTTP ${result.status})`)
      } else {
        setFeedback(`Fehler HTTP ${result.status}: ${result.message}`)
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoadingSlug(null)
    }
  }

  return (
    <>
      <hr className={twMerge('not-prose my-10 border-0 border-t border-gray-900/10')} />
      <Disclosure title="Interne Pipeline-Hooks" defaultOpen={false}>
        <div className="space-y-3 p-3">
          <p className="text-sm text-gray-600">
            Dieselben Endpunkte wie nach dem Processing (API-Key serverseitig). Vor der Statistik
            die SQL-Funktionen ausführen.
          </p>
          <ul className={cardClassName}>
            {adminPrivateHookUiItems.map((item) => (
              <li
                key={item.slug}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
              >
                <div>
                  <p className="text-sm/6 font-semibold text-gray-900">{item.label}</p>
                  {'longRunning' in item && item.longRunning ? (
                    <p className="mt-1 text-sm text-gray-600">
                      Dieser Aufruf kann sehr lange dauern; der Server wartet auf Abschluss.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={loadingSlug !== null}
                  className={triggerButtonClassName}
                  onClick={() => {
                    if (!window.confirm(item.confirmMessage)) return
                    void handleTrigger(item.slug)
                  }}
                >
                  {loadingSlug === item.slug ? 'Läuft…' : 'Auslösen'}
                </button>
              </li>
            ))}
          </ul>
          {feedback ? (
            <p className="text-sm text-gray-800" role="status">
              {feedback}
            </p>
          ) : null}
        </div>
      </Disclosure>
    </>
  )
}
