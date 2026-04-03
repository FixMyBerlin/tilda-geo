import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/drawing/drawAreaTypes'
import { useDrawSession } from './useDrawSession'

export const useDrawParam = () => {
  const { drawAreas, setDrawAreas } = useDrawSession()
  return {
    drawParam: drawAreas,
    setDrawParam: (value: DrawArea[] | null) => {
      void setDrawAreas(value ?? [])
    },
  }
}
