import { PlanningCandidateSelectionReset } from '@/components/regionen/pageRegionSlug/Planning/candidates/PlanningCandidateToggle'
import { SpaceFinderPanelBody } from '@/components/regionen/pageRegionSlug/Planning/PlanningPanel'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { ModePanel } from '../ModePanel'
import { useSpaceFinderSelection } from './useSpaceFinderSelection'

/**
 * Flächenfinder mode page. First port (phase 2 of the mode migration): the existing panel
 * sections (`SpaceFinderPanelBody`, formerly the floating `PlanningPanel`) render unchanged in
 * behavior inside the shared `ModePanel` chrome. The collection selector / detail views / body
 * redesign (D4/D5) are phase 3.
 */
export const PageModeSpaceFinder = () => {
  const { variant } = useSpaceFinderSelection()

  return (
    <ModePanel
      title={variant ? `Variante ${frenchQuote(variant.title)}` : 'Flächenfinder'}
      subtitle={variant ? `Gebiet ${frenchQuote(variant.area.title)}` : undefined}
    >
      <PlanningCandidateSelectionReset />
      <SpaceFinderPanelBody />
    </ModePanel>
  )
}
