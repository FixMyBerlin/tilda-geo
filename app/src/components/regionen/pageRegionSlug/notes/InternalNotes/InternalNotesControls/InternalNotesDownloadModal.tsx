import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { Link } from '@/components/shared/links/Link'
import { IconModal } from '@/components/shared/Modal/IconModal'

export const InternalNotesDownloadModal = () => {
  const region = useStaticRegion()

  return (
    <section>
      <IconModal
        title="Interne Hinweise downloaden"
        titleIcon="download"
        triggerStyle="z-0 -ml-px inline-flex justify-center border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:text-gray-800 focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white hover:bg-yellow-50"
        triggerIcon={<ArrowDownTrayIcon className="size-5" />}
      >
        <p className="pt-5 pb-2.5 text-sm">
          Die internen Hinweise stehen alle Nutzer:innen mit Rechten auf der Region zum Download zur
          Verfügung.
        </p>

        <div className="flex gap-2">
          <Link
            href={`/api/notes/${region.slug}/download?format=csv`}
            classNameOverwrite="w-24 flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
            download
            blank
          >
            <strong className="mb-0.5 block text-xs font-medium text-gray-900">Download:</strong>
            <span className="block w-full border-0 p-0 font-mono text-gray-500 placeholder-gray-500 focus:ring-0 sm:text-sm">
              CSV
            </span>
          </Link>

          <Link
            href={`/api/notes/${region.slug}/download?format=geojson`}
            classNameOverwrite="w-24 flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
            download
            blank
          >
            <strong className="mb-0.5 block text-xs font-medium text-gray-900">Download:</strong>
            <span className="block w-full border-0 p-0 font-mono text-gray-500 placeholder-gray-500 focus:ring-0 sm:text-sm">
              GeoJSON
            </span>
          </Link>
        </div>
      </IconModal>
    </section>
  )
}
