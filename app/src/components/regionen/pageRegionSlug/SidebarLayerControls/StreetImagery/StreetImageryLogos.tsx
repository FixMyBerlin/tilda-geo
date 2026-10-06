import { twJoin } from 'tailwind-merge'
import googleStreetViewLogoUrl from './google-street-view-logo.svg'
import infra3dLogoUrl from './infra3d-logo.svg'
import mapillaryLogoMonoUrl from './mapillary-logo-mono.svg'
import mapillaryLogoUrl from './mapillary-logo.svg'
import panoramaxLogoUrl from './panoramax-logo.svg'

type Props = {
  className?: string
  /** One colour (black) instead of the logo's own colours: for the pressed, yellow button. */
  mono?: boolean
}

// Coloured shapes on transparent → all black.
const monoShapesClassName = 'brightness-0'

// Mapillary: the 'dotcompass' logo from Mapillary's logo files, cropped to the circle.
// Google Street View: https://commons.wikimedia.org/wiki/File:Google_Street_View_icon.svg
// Apple Look Around: binoculars as in Apple Maps; this drawing is from Phosphor Icons (MIT).
// Panoramax: the project's own logo as shipped with `@panoramax/web-viewer` (MIT).
// infra3D: the symbol (without the wordmark) of the logo on https://www.infra3d.com.

// Pressed: the green disc in black, the arrow stays white.
const MapillaryLogo = ({ className, mono }: Props) => (
  <img
    src={mono ? mapillaryLogoMonoUrl : mapillaryLogoUrl}
    alt=""
    aria-hidden="true"
    className={className}
  />
)

// Keeps its colours; on the pressed, yellow button it sits on a white disc so the yellow figure
// stays visible.
const GoogleStreetViewLogo = ({ className, mono }: Props) =>
  mono ? (
    <span className="flex size-6.5 items-center justify-center rounded-full bg-white">
      <img src={googleStreetViewLogoUrl} alt="" aria-hidden="true" className="size-4" />
    </span>
  ) : (
    <img src={googleStreetViewLogoUrl} alt="" aria-hidden="true" className={className} />
  )

const AppleLookAroundLogo = ({ className }: Props) => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M237.22,151.9l0-.1a1.42,1.42,0,0,0-.07-.22,48.46,48.46,0,0,0-2.31-5.3L193.27,51.8a8,8,0,0,0-1.67-2.44,32,32,0,0,0-45.26,0A8,8,0,0,0,144,55V80H112V55a8,8,0,0,0-2.34-5.66,32,32,0,0,0-45.26,0,8,8,0,0,0-1.67,2.44L21.2,146.28a48.46,48.46,0,0,0-2.31,5.3,1.72,1.72,0,0,0-.07.21s0,.08,0,.11a48,48,0,0,0,90.32,32.51,47.49,47.49,0,0,0,2.9-16.59V96h32v71.83a47.49,47.49,0,0,0,2.9,16.59,48,48,0,0,0,90.32-32.51Zm-143.15,27a32,32,0,0,1-60.2-21.71l1.81-4.13A32,32,0,0,1,96,167.88V168h0A32,32,0,0,1,94.07,178.94ZM203,198.07A32,32,0,0,1,160,168h0v-.11a32,32,0,0,1,60.32-14.78l1.81,4.13A32,32,0,0,1,203,198.07Z" />
  </svg>
)

// Keeps its colours on the pressed button as well.
const PanoramaxLogo = ({ className }: Props) => (
  <img src={panoramaxLogoUrl} alt="" aria-hidden="true" className={className} />
)

const Infra3dLogo = ({ className, mono }: Props) => (
  <img
    src={infra3dLogoUrl}
    alt=""
    aria-hidden="true"
    className={twJoin(className, mono && monoShapesClassName)}
  />
)

/** Logo of a provider (`mapillary`, `panoramax`) or opener (`streetview`, `lookaround`, infra3D). */
export const StreetImageryLogo = ({ id, className, mono }: Props & { id: string }) => {
  if (id === 'mapillary') return <MapillaryLogo className={className} mono={mono} />
  if (id === 'panoramax') return <PanoramaxLogo className={className} />
  if (id === 'streetview') return <GoogleStreetViewLogo className={className} mono={mono} />
  if (id === 'lookaround') return <AppleLookAroundLogo className={className} />
  return <Infra3dLogo className={className} mono={mono} />
}
