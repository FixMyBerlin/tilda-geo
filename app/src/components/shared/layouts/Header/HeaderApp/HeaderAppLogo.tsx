import { Img } from '@/components/shared/Img'
import svgTildaLogoWhite from '../../assets/tilda-logo-weiss.svg'
import svgTildaLogoBlack from '../../assets/tilda-logo.svg'

export const HeaderAppLogoWhite = () => {
  return (
    <>
      <Img src={svgTildaLogoWhite} alt="TILDA Logo" className="h-8 w-auto" />{' '}
    </>
  )
}

export const HeaderAppLogoBlack = () => {
  return (
    <>
      <Img src={svgTildaLogoBlack} alt="TILDA Logo" className="h-8 w-auto" />{' '}
    </>
  )
}
