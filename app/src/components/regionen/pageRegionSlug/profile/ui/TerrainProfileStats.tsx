import type { TerrainProfileStats } from '../types'

type Props = {
  stats: TerrainProfileStats
}

export const TerrainProfileStatsView = ({ stats }: Props) => {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-700">
      <div>
        <dt className="text-gray-500">Mindesthöhe</dt>
        <dd className="font-medium">{stats.minElevationMeters.toFixed(1)} m</dd>
      </div>
      <div>
        <dt className="text-gray-500">Maximalhöhe</dt>
        <dd className="font-medium">{stats.maxElevationMeters.toFixed(1)} m</dd>
      </div>
      <div>
        <dt className="text-gray-500">Anstieg</dt>
        <dd className="font-medium">{stats.ascentMeters.toFixed(1)} m</dd>
      </div>
      <div>
        <dt className="text-gray-500">Abstieg</dt>
        <dd className="font-medium">{stats.descentMeters.toFixed(1)} m</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-gray-500">Strecke</dt>
        <dd className="font-medium">{stats.distanceMeters.toFixed(1)} m</dd>
      </div>
    </dl>
  )
}
