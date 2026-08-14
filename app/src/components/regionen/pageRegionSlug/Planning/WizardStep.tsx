import { CollapsibleBox } from './CollapsibleBox'

/**
 * Nummerierter, unabhängig auf-/zuklappbarer Schritt eines Assistenten (z.B. `AreaWizard`).
 * Jeder Schritt startet offen und lässt sich per Klick auf den Titel einklappen.
 */
export const WizardStep = ({
  number,
  title,
  defaultOpen = true,
  children,
}: {
  number: number
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) => (
  <CollapsibleBox
    title={title}
    defaultOpen={defaultOpen}
    leading={
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
        {number}
      </span>
    }
  >
    {children}
  </CollapsibleBox>
)
