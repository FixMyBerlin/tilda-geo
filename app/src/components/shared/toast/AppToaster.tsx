import { Toaster } from 'sonner'

/** App-wide toast host — mount once in LayoutRoot. */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans',
        },
      }}
    />
  )
}
