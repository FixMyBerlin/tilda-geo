import { HomePageCtaBanner } from './pageIndex/HomePageCtaBanner'
import { HomePageFaq } from './pageIndex/HomePageFaq'
import { HomePageHero } from './pageIndex/HomePageHero'
import { HomePageProducts } from './pageIndex/HomePageProducts'
import { HomePageTrustBar } from './pageIndex/HomePageTrustBar'
import { HomePageWhy } from './pageIndex/HomePageWhy'

export function PageIndex() {
  return (
    <>
      <HomePageHero />
      <HomePageTrustBar />
      <HomePageProducts />
      <HomePageWhy />
      <HomePageFaq />
      <HomePageCtaBanner />
    </>
  )
}
