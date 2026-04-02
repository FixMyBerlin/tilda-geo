import { getRouteApi } from '@tanstack/react-router'
import { Link } from '@/components/shared/links/Link'
import { HeaderApp } from '../shared/layouts/Header/HeaderApp/HeaderApp'

const routeApi = getRouteApi('/regionen/stats')
const sumLength = (lengthMap: Record<string, number>) =>
  Object.values(lengthMap).reduce((acc: number, curr: number) => acc + curr, 0)

export function PageStats() {
  const stats = routeApi.useLoaderData()
  return (
    <div className="flex h-screen flex-col">
      <HeaderApp />
      <main className="z-0 grow">
        <div className="mx-auto my-10 prose max-w-prose">
          <div className="pb-8">
            <h1>Download</h1>
            <Link
              to="/api/stats"
              classNameOverwrite="w-28 flex-none rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm hover:bg-yellow-50 focus:ring-1 focus:ring-yellow-500"
              download
              blank
            >
              <strong className="mb-0.5 text-xs font-medium text-gray-900">Download</strong>
            </Link>
          </div>

          {stats
            ?.sort((a, b) => Number(a.level) - Number(b.level))
            .map((region) => (
              <div key={region.name ?? undefined}>
                <h1> {region.name}</h1>
                <h2 className="text-gray-900">{`admin_level=${region.level}`}</h2>
                Bikelanes ({sumLength(region.bikelane_length ?? {})} km):
                <p>{JSON.stringify(region.bikelane_length, null, 2)}</p>
                Roads ({sumLength(region.road_length ?? {})} km):
                <p>{JSON.stringify(region.road_length, null, 2)}</p>
              </div>
            ))}
        </div>
      </main>
    </div>
  )
}
