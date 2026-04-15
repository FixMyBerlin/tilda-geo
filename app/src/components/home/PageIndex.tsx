import { HomePageFAQ } from './pageIndex/HomePageFAQ'
import { HomePageHero } from './pageIndex/HomePageHero'
import { HomePageLive } from './pageIndex/HomePageLive'
import { HomePageProducts } from './pageIndex/HomePageProducts'
import { HomePageUSP } from './pageIndex/HomePageUSP'

export function PageIndex() {
  return (
    <>
      <HomePageHero />
      <HomePageProducts />
      <HomePageUSP />
      <HomePageLive />
      <HomePageFAQ />
    </>
  )
}
