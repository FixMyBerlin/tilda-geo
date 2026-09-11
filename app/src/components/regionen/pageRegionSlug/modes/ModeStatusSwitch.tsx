import { Field, Label, Switch } from '@headlessui/react'
import { twJoin } from 'tailwind-merge'
import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  checkedLabel: string
  uncheckedLabel: string
  pending?: boolean
  title?: string
}

/**
 * "Status: offen/geschlossen" (or erledigt) switch shared by `EditNoteResolvedAtForm` (TILDA
 * notes) and `OsmNoteCommentForm` (OSM notes) — same look, configurable labels only.
 */
export const ModeStatusSwitch = ({
  checked,
  onChange,
  checkedLabel,
  uncheckedLabel,
  pending = false,
  title,
}: Props) => (
  <Field as="div" className="flex items-center gap-1.5 text-sm" title={title}>
    <span>Status:</span>
    <Switch
      checked={checked}
      disabled={pending}
      onChange={onChange}
      className={twJoin(
        checked ? 'bg-yellow-600' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      <span className="sr-only">Status</span>
      <span
        className={twJoin(
          checked ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none relative inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        )}
      >
        <span
          className={twJoin(
            checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          )}
          aria-hidden="true"
        >
          <SvgNotesQuestionmark className="size-5 text-sky-700" />
        </span>
        <span
          className={twJoin(
            checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          )}
          aria-hidden="true"
        >
          <SvgNotesCheckmark className="size-5 text-sky-700" />
        </span>
      </span>
    </Switch>
    <Label as="span">
      {checked ? checkedLabel : uncheckedLabel}
      <span className="sr-only">.</span>
    </Label>
    {pending && <SmallSpinner />}
  </Field>
)
