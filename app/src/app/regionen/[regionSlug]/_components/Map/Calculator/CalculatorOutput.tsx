import { ArrowRightIcon, TrashIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { useMapCalculatorAreasWithFeatures } from '../../../_hooks/mapState/useMapState'
import { MapDataSourceCalculator } from '../../../_mapData/types'
import { DrawArea, DrawControlProps } from './CalculatorControlsDrawControl'
import { useDelete } from './hooks/useDelete'

// NOTE: `keys` are unused for now. `capacity` is counted, not summed; lets see what other keys/data we will need …
type Props = {
  keys: MapDataSourceCalculator['keys']
  drawControlRef: DrawControlProps['ref']
}

export const CalculatorOutput = ({ keys: _unused, drawControlRef }: Props) => {
  // <PointCalculator> only sums Point feature. Each point is considere `capacity=1`
  const calculatorAreasWithFeatures = useMapCalculatorAreasWithFeatures()
  const sums = calculatorAreasWithFeatures.map(({ key, features }) => {
    const onlyTypePoint = features.filter((f) => f.geometry.type === 'Point')
    return [key, onlyTypePoint.length] as const
  })

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
        'absolute z-1000 flex items-center rounded-md bg-fuchsia-800/90 px-2 py-0.5 text-xl leading-tight text-white shadow-xl',
        sums.length ? 'items-center' : 'items-start',
      )}
      style={{
        right: '7px',
        top: '75px',
        minHeight: '65px',
        paddingRight: '40px',
        maxWidth: '125px',
      }}
    >
      {sums.length ? (
        <div className={twJoin(sums.length === 0 && 'text-white/60')}>
          <div className={twJoin(sums.length > 0 && 'text-white/50')}>Summe</div>
          {sums.map(([key, sum]) => (
            <strong key={key} className="block">
              {sum}
              <button type="button" onClick={() => handleDelete(key)}>
                <TrashIcon className="ml-1 h-4 w-4 text-white/30 hover:text-white/90" />
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
        <div className="text-xs leading-tight">
          <div className="flex items-center text-right">
            <strong>Summe</strong>
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </div>
          <div className="text-white/60">Flächen zeichnen</div>
        </div>
      )}
    </section>
  )
}
