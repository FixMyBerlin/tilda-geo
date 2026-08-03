import { twJoin } from 'tailwind-merge'
import svgTildaLogoWhite from '@/components/layouts/assets/tilda-logo-weiss.svg'
import { Img } from '@/components/shared/Img'
import { playwrightTestId } from '@/components/shared/utils/playwright'
import type { TRegionWelcomeImage } from '@/server/regions/regionConfigMapper.server'

type Props = {
  image: TRegionWelcomeImage | null
}

const heroFrameClassName =
  'aspect-3/2 w-full overflow-hidden rounded-xl ring-1 ring-white/10 sm:aspect-video'

export const RegionWelcomeHeroImage = ({ image }: Props) => {
  if (image) {
    return (
      <div
        data-testid={playwrightTestId('region-welcome-hero-image')}
        className={heroFrameClassName}
      >
        <Img src={image.path} alt={image.altText} className="size-full object-cover" />
      </div>
    )
  }

  // Side column on desktop only — omit below lg where content stacks without a hero slot.
  return (
    <div
      data-testid={playwrightTestId('region-welcome-hero-placeholder')}
      className={twJoin(heroFrameClassName, 'relative hidden bg-gray-800 lg:block')}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute right-0 bottom-0 h-[56%] w-[34%] overflow-hidden"
        aria-hidden
      >
        <Img
          src={svgTildaLogoWhite}
          alt=""
          aria-hidden
          className="h-[min(165%,14rem)] w-auto max-w-none opacity-10"
        />
      </div>
    </div>
  )
}
