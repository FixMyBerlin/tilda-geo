import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { twJoin } from 'tailwind-merge'
import { TagsTableRow } from '../TagsTableRow'
import { ConditionalFormattedValue } from '../translations/ConditionalFormattedValue'
import { ValueDisclosure, ValueDisclosureButton, ValueDisclosurePanel } from '../ValueDisclosure'
import { SvgFaPersonDigging } from './icons/SvgFaPersonDigging'
import { CompositTableRow } from './types'

const livecycleStyle = {
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
      'Bitte schicken Sie diese URL an feedback@fixmycity.de mit dem Hinweis: Fehler im Inspector für das Attribut "livecycle".',
  },
}

export const TagsTableRowLivecycle = ({
  sourceId,
  tagKey: _, // is always `livecycle`
  properties,
}: CompositTableRow) => {
  const livecycleValue = properties['livecycle']
  if (!livecycleValue) return null

  const style = livecycleStyle[livecycleValue] || livecycleStyle.fallback

  return (
    <TagsTableRow sourceId={sourceId} tagKey={'livecycle'} tagValue={undefined}>
      <ValueDisclosure>
        <ValueDisclosureButton>
          <div className={twJoin(style.colorClass, 'flex items-center gap-2')}>
            {style.icon}
            <ConditionalFormattedValue
              sourceId={sourceId}
              tagKey={'livecycle'}
              tagValue={livecycleValue}
            />
          </div>
        </ValueDisclosureButton>
        <ValueDisclosurePanel>{style.description}</ValueDisclosurePanel>
      </ValueDisclosure>
    </TagsTableRow>
  )
}
