import { GeocodingControl } from '@maptiler/geocoding-control/maplibregl'
import { useEffect } from 'react'
import type { ControlPosition } from 'react-map-gl/maplibre'
import { useControl } from 'react-map-gl/maplibre'
import { useMobileSearchStore } from '../../mobile/useMobileSearchStore'
import { MAPTILER_API_KEY } from '../utils/maptilerApiKey.const'

type SearchControlClientProps = {
  position: ControlPosition
}

// On mobile the geocoder is hidden until the search button reveals it (animated),
// keyed on the `data-mobile-search` attribute on <html>. Desktop (≥ sm) is untouched.
const mobileSearchCss = `
.maplibregl-ctrl-geocoder .input-group { border: 1px solid rgb(212 212 216) }
@media (max-width: 639px) {
  .maplibregl-ctrl-top-right .maplibregl-ctrl-geocoder {
    transition: opacity 150ms ease, transform 150ms ease;
  }
  /* Hidden until the search button opens it */
  html[data-mobile-search='closed'] .maplibregl-ctrl-top-right .maplibregl-ctrl-geocoder {
    opacity: 0;
    transform: translateY(-0.5rem);
    pointer-events: none;
  }
  /* Open: a full-width bar pinned to the top, above the header buttons, with a
     gutter that matches the MobileMapHeader padding (p-2 = 0.5rem). */
  html[data-mobile-search='open'] .maplibregl-ctrl-top-right {
    position: absolute;
    inset: 0 0 auto 0;
    z-index: 50;
    margin: 0;
    padding: 0.5rem;
  }
  /* Reset the library's fixed width/margins so the control fills the gutter-padded
     bar and the inner input aligns edge-to-edge. */
  html[data-mobile-search='open'] .maplibregl-ctrl-top-right .maplibregl-ctrl-geocoder {
    width: auto;
    min-width: 0;
    max-width: none;
    margin: 0;
  }
  html[data-mobile-search='open'] .maplibregl-ctrl-geocoder .input-group { width: 100%; }
  html[data-mobile-search='open'] .maplibregl-ctrl-geocoder .input-group input { width: 100%; }
}
`

export const SearchControlClient = ({ position }: SearchControlClientProps) => {
  const control = useControl(
    () =>
      new GeocodingControl({
        apiKey: MAPTILER_API_KEY,
        placeholder: 'Suche',
        proximity: [
          {
            type: 'map-center',
          },
        ],
        country: 'DE',
      }),
    { position },
  )

  const open = useMobileSearchStore((state) => state.open)
  const setOpen = useMobileSearchStore((state) => state.setOpen)
  const setControl = useMobileSearchStore((state) => state.setControl)

  // Bridge the control's focus()/blur() to the mobile search button and close the
  // mobile search when the input loses focus (tap outside / result selected).
  useEffect(() => {
    setControl({ focus: () => control.focus(), blur: () => control.blur() })
    const subscription = control.on('focusout', () => setOpen(false))
    return () => {
      subscription.unsubscribe()
      setControl(null)
    }
  }, [control, setControl, setOpen])

  // Reveal/hide signal for the mobile-only CSS above.
  useEffect(() => {
    document.documentElement.dataset.mobileSearch = open ? 'open' : 'closed'
    return () => {
      delete document.documentElement.dataset.mobileSearch
    }
  }, [open])

  return (
    <style
      // oxlint-disable-next-line react/no-danger -- static CSS for geocoder control
      dangerouslySetInnerHTML={{ __html: mobileSearchCss }}
    />
  )
}
