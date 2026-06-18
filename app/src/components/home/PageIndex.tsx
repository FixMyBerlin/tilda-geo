import { HomePageHero } from './pageIndex/HomePageHero'
import { HomePageLive } from './pageIndex/HomePageLive'

export function PageIndex() {
  return (
    <main className="z-0 grow">
      <HomePageHero />
      <HomePageLive />
    </main>
  )
}
