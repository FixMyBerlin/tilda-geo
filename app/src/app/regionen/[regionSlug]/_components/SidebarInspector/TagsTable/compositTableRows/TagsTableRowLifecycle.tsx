import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { SvgFaPersonDigging } from './icons/SvgFaPersonDigging'
import { CompositTableRow } from './types'

const lifecycleStyle = {
  construction: {
    icon: <SvgFaPersonDigging className="size-5 text-amber-600" />,
    colorClass: 'text-amber-600',
    description:
      'Dieser Weg ist in OSM als Baustelle angegeben. In TILDA zeigen wir ihn aber mit den angegebenen Infrastruktur-Attributen an. Diese können entweder den Zustand vor der Baustelle oder den Ziel-Zustand beschreiben; je nach Erfassungs-Stand.',
  },
  temporary: {
    icon: <SvgFaPersonDigging className="size-5 text-amber-600" />,
    colorClass: 'text-amber-600',
    description:
      'Dieser Weg ist in OSM als temporärer Weg angegeben. Meistens ist das der Fall, wenn es sich um einen Ersatz-Weg für eine Baustelle handelt.',
  },
  fallback: {
    icon: <QuestionMarkCircleIcon className="size-5 text-amber-600" />,
    colorClass: '',
    description:
      'Bitte schicken Sie diese URL an feedback@fixmycity.de mit dem Hinweis: Fehler im Inspector für das Attribut "lifecycle".',
  },
}

export const TagsTableRowlifecycle = ({
  sourceId,
  tagKey: _, // is always `lifecycle`
  properties,
}: CompositTableRow) => {
  const lifecycleValue = properties['lifecycle']
  if (!lifecycleValue) return null

  const style = lifecycleStyle[lifecycleValue] || lifecycleStyle.fallback

  return (
    <TagsTableRow sourceId={sourceId} tagKey={'lifecycle'} tagValue={undefined}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <div className={twJoin(style.colorClass, 'flex items-center gap-2')}>
            {style.icon}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'lifecycle'}
              tagValue={lifecycleValue}
            />
          </div>
        </ValueDisclosureButton>
        <ValueDisclosurePanel>{style.description}</ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}
