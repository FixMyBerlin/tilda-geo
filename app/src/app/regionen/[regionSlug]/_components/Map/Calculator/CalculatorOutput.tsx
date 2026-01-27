import { ArrowUpIcon, TrashIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useMapCalculatorAreasWithFeatures } from '../../../_hooks/mapState/useMapState'
import { MapDataSourceCalculator } from '../../../_mapData/types'
import { DrawArea, DrawControlProps } from './CalculatorControlsDrawControl'
import { useDelete } from './hooks/useDelete'

// NOTE: `keys` are unused for now. `capacity` is counted, not summed; lets see what other keys/data we will need …
type Props = {
  keys: MapDataSourceCalculator['keys']
  drawControlRef: DrawControlProps['ref']
  subcategoryName?: string
}

export const CalculatorOutput = ({ keys: _unused, drawControlRef, subcategoryName }: Props) => {
  // <PointCalculator> only sums Point feature. Each point is considere `capacity=1`
  const calculatorAreasWithFeatures = useMapCalculatorAreasWithFeatures()
  const sums = calculatorAreasWithFeatures.map(({ key, features }) => {
    const onlyTypePoint = features.filter((f) => f.geometry.type === 'Point')
    return [key, onlyTypePoint.length] as const
  })

  const displayName = subcategoryName?.replace(/^Summieren: /, '')

  const { deleteDrawFeatures } = useDelete()
  const handleDelete = (key: string) => {
    if (!drawControlRef?.current) return
    const feature = drawControlRef.current.get(key) as DrawArea | undefined
    if (!feature) return
    const features = drawControlRef.current.getAll().features as DrawArea[]
    deleteDrawFeatures(features, [feature])
    drawControlRef.current.delete(key)
  }

  return (
    <section
      className={twJoin(
        'absolute z-1000 flex min-w-0 items-center rounded-md bg-fuchsia-800/90 px-2 py-0.5 text-xl leading-tight text-white shadow-xl',
        sums.length ? 'items-center' : 'items-start',
      )}
      style={{
        left: '270px',
        top: '75px',
        minHeight: '65px',
        maxWidth: '125px',
      }}
    >
      {sums.length ? (
        <div className={twJoin('min-w-0', sums.length === 0 && 'text-white/60')}>
          <div className={twJoin('min-w-0', sums.length > 0 && 'text-white/50')}>
            SUMME
            {displayName && (
              <p className="min-w-0 w-full truncate text-[0.6rem] leading-tight text-white/40">{displayName}</p>
            )}
          </div>
          {sums.map(([key, sum]) => (
            <strong key={key} className="block">
              {sum}
              <button type="button" onClick={() => handleDelete(key)}>
                <TrashIcon className="ml-1 size-4 text-white/30 hover:text-white/90" />
              </button>
            </strong>
          ))}
          {sums.length > 1 && (
            <strong className="mt-1 block w-full border-t border-white/60 py-0.5">
              {sums.map(([_k, v]) => v).reduce((prevV, currV) => prevV + currV)}
            </strong>
          )}
        </div>
      ) : (
        <div className="min-w-0 text-xs leading-tight">
          <div className="flex items-center gap-1 text-right">
            <ArrowUpIcon className="size-4" />
            <strong>SUMME</strong>
          </div>
          {displayName && (
            <div className="min-w-0 w-full truncate text-[0.6rem] leading-tight text-white/40">{displayName}</div>
          )}
          <div className="mt-1.5 text-white">Flächen zeichnen</div>
        </div>
      )}
    </section>
  )
}
