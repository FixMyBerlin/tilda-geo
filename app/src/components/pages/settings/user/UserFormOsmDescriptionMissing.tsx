import { ClipboardIcon } from '@heroicons/react/20/solid'
import { useRouter } from '@tanstack/react-router'
import { startTransition, useEffect, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { Link } from '@/components/shared/links/Link'
import { linkStyles } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { Markdown } from '@/components/shared/text/Markdown'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import { pollOsmUserDescriptionFn, updateOsmDescriptionFn } from '@/server/users/users.functions'

export const UserFormOsmDescriptionMissing = () => {
  // === Polling to refresh the osmDescription ===
  // Once the user clicks the button to open OSM to update her description, we start polling.
  // We poll 10 times every 5 seconds.
  // If we receive a osmDescription which is text, we update it and refresh the page data.
  const router = useRouter()
  const maxPollCount = 10
  const [pollUpdatedUserdataCount, setPollUpdatedUserdataCount] = useState<number | null>(null)

  useEffect(
    function pollUpdatedOsmDescription() {
      if (pollUpdatedUserdataCount === null) {
        return
      }
      if (pollUpdatedUserdataCount >= maxPollCount) {
        startTransition(() => {
          setPollUpdatedUserdataCount(null)
        })
        return
      }
      let shouldStopPolling = false

      const pollUserDetails = async () => {
        if (shouldStopPolling) return

        try {
          const description = await pollOsmUserDescriptionFn()

          if (description) {
            // Found description, update it and stop polling
            shouldStopPolling = true
            await updateOsmDescriptionFn({ data: { osmDescription: description } })
            router.invalidate()
            setPollUpdatedUserdataCount(null)
          } else if (!shouldStopPolling) {
            // No description yet, continue polling
            setPollUpdatedUserdataCount((count) => (count || 0) + 1)
          }
        } catch (error) {
          console.error('Error polling OSM user description:', error)
          // Continue polling even on error (might be temporary network issue)
          if (!shouldStopPolling) {
            setPollUpdatedUserdataCount((count) => (count || 0) + 1)
          }
        }
      }

      // Poll every 5 seconds
      const interval = setInterval(pollUserDetails, 5000)
      // Initial poll immediately
      pollUserDetails()

      return function stopPollingInterval() {
        shouldStopPolling = true
        clearInterval(interval)
      }
    },
    [pollUpdatedUserdataCount, router],
  )

  // === Text recommendation and helper to copy the text ===
  const [copySuccess, setCopySuccess] = useState('')
  const textToCopy = `Dies ist ein Account der Abteilung NAME im AMT_NAME. Wir nutzen OSM-Daten für die Erfassung und Planung von Radinfrastruktur mithilfe von [TILDA Radverkehr](https://osm.wiki/FixMyCity_GmbH/TILDA).`
  const copyToClipboard = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopySuccess('✔︎')
    } catch (_error) {
      setCopySuccess('❌ Kopieren fehlgeschlagen')
    }
  }

  return (
    <section
      className="my-4 prose prose-sm rounded border border-amber-300 bg-amber-50 p-4"
      id="description-missing"
    >
      <h3>Bitte vervollständigen Sie Ihr Profil auf OpenStreetMap</h3>
      <p className="my-1">Ihre Profilbeschreibung auf OpenStreetMap ist aktuell leer.</p>
      <p className="my-1">
        Für die OSM-Community ist es hilfreich zu verstehen, aus welchem Kontext / welcher Position
        ein Benutzer stammt, um Hinweise und Beiträge besser einordnen zu können.
      </p>
      <p className="my-1">
        Für die Profilbeschreibung können Sie sich an dem Vorschlag unten zu orientieren.
      </p>
      <p className="my-2 flex items-center gap-2">
        <Link
          button
          blank
          href={getOsmUrl('/profile/edit')}
          onClick={() => setPollUpdatedUserdataCount(0)}
          className="bg-yellow-200 shadow"
        >
          Profilbeschreibung ergänzen
        </Link>
        {pollUpdatedUserdataCount !== null && (
          <span className="flex items-center gap-2">
            <SmallSpinner />
            <span className="text-xs">
              Prüfe periodisch auf neue Profildaten ({pollUpdatedUserdataCount} / {maxPollCount})…
            </span>
          </span>
        )}
      </p>

      <blockquote>
        <Markdown markdown={textToCopy} />
      </blockquote>
      <button
        type="button"
        onClick={copyToClipboard}
        className={twJoin('flex items-center gap-0.5', linkStyles)}
      >
        <ClipboardIcon className="size-5" />
        Textvorlage kopieren {copySuccess}
      </button>
    </section>
  )
}
