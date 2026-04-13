import 'maplibre-gl/dist/maplibre-gl.css'
import { Spinner } from '@/components/shared/Spinner/Spinner'

const bottomCtrlShellClass = 'maplibregl-ctrl pointer-events-none'

export function RegionPagePendingMapShell() {
  return (
    <div className="relative flex h-full w-full flex-row gap-4">
      <div
        className="via-stone-200 to-stone-300/90 absolute inset-0 bg-linear-to-br from-emerald-50/50"
        aria-hidden="true"
      />

      <section
        className="absolute top-0 left-0 z-20 max-h-full w-65 bg-white py-px shadow-md"
        aria-hidden="true"
      />

      <div
        className="maplibregl-ctrl pointer-events-none absolute top-2 right-2 z-10"
        aria-hidden="true"
      >
        <div className="maplibregl-ctrl-group">
          <button
            type="button"
            disabled
            tabIndex={-1}
            className="maplibregl-ctrl-zoom-in"
            aria-hidden="true"
          />
          <button
            type="button"
            disabled
            tabIndex={-1}
            className="maplibregl-ctrl-zoom-out"
            aria-hidden="true"
          />
        </div>
      </div>

      <div
        className="pointer-events-none fixed right-2.5 bottom-4 z-10 mt-2.5 flex max-w-full flex-wrap items-end justify-end gap-1.5"
        aria-hidden="true"
      >
        <div className={bottomCtrlShellClass}>
          <div className="maplibregl-ctrl-group">
            <button type="button" disabled tabIndex={-1} aria-hidden="true" />
          </div>
        </div>
        <div className={bottomCtrlShellClass}>
          <div className="maplibregl-ctrl-group">
            <button type="button" disabled tabIndex={-1} aria-hidden="true" />
          </div>
        </div>
        <div className={bottomCtrlShellClass}>
          <div className="maplibregl-ctrl-group">
            <button type="button" disabled tabIndex={-1} aria-hidden="true" />
          </div>
        </div>
        <div className={bottomCtrlShellClass}>
          <div className="maplibregl-ctrl-group">
            <button
              type="button"
              disabled
              tabIndex={-1}
              className="w-10! min-w-10!"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-5 flex flex-col items-center justify-center gap-4">
        <Spinner color="yellow" screenReaderLabel={false} size="12" />
        <p className="text-base text-gray-500">Karte wird geladen …</p>
      </div>
    </div>
  )
}
