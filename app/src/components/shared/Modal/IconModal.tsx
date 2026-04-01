import type React from 'react'
import { useState } from 'react'
import { ModalDialog } from './ModalDialog'

type ModalDialogProps = {
  title: string
  icon: 'info' | 'error' | 'copyright' | 'download' | 'edit'
  buttonCloseName?: string
  open: boolean
  setOpen: (value: boolean) => void
  children: React.ReactNode
}

export type Props = Pick<ModalDialogProps, 'title' | 'buttonCloseName'> & {
  titleIcon?: ModalDialogProps['icon']
  /* @desc: Either one of the 3 or custom css classes */
  triggerStyle: 'circle' | 'button' | 'debugCircle' | (string & {})
  triggerIcon: React.ReactNode
  children: React.ReactNode
}

export const IconModal = ({
  title,
  titleIcon = 'info',
  triggerStyle = 'button',
  children,
  buttonCloseName = 'Schließen',
  triggerIcon,
}: Props) => {
  const [open, setOpen] = useState(false)

  const triggerStyles: Record<Props['triggerStyle'], string> = {
    circle:
      'inline-flex flex-none grow-0 items-center rounded-full border border-transparent bg-gray-300 px-1 py-1 text-sm font-medium leading-4 text-gray-500 shadow-sm hover:bg-yellow-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2',
    debugCircle:
      'inline-flex flex-none grow-0 items-center rounded-full border border-transparent bg-pink-300 px-1 py-1 text-sm font-medium leading-4 text-pink-500 shadow-sm hover:bg-pink-200 hover:text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2',
    button:
      'inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500',
  }

  const classes = triggerStyles[triggerStyle] ? triggerStyles[triggerStyle] : triggerStyle

  return (
    <>
      <button type="button" className={classes} onClick={() => setOpen(true)}>
        {triggerIcon}
      </button>
      <ModalDialog
        title={title}
        icon={titleIcon}
        open={open}
        setOpen={setOpen}
        buttonCloseName={buttonCloseName}
      >
        {children}
      </ModalDialog>
    </>
  )
}
