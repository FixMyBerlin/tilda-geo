import { useBg3dParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useBg3dParam'

const isMacPlatform =
  typeof navigator !== 'undefined' &&
  (/Mac|iPhone|iPad|iPod/i.test(navigator.platform) || /Mac OS X/i.test(navigator.userAgent))

type Props = {
  className?: string
}

/** Shortcut hints shown below the Höhenprofil block in the inspector. */
export const InspectorHints = ({ className }: Props) => {
  const { is3dActive } = useBg3dParam()
  const multiSelectModifier = isMacPlatform ? '⌘' : 'Strg'
  // MapLibre drag-rotate uses Ctrl (not ⌘) on all platforms; German Windows label is Strg.
  const rotateModifier = isMacPlatform ? 'Control' : 'Strg'

  return (
    <div className={className}>
      <div className="space-y-1 text-xs leading-snug text-gray-500">
        <p>Mehrfachauswahl: {multiSelectModifier} + Klick</p>
        {is3dActive ? (
          <p>3D drehen/neigen: rechte Maustaste ziehen (oder {rotateModifier} + Ziehen)</p>
        ) : null}
      </div>
    </div>
  )
}
