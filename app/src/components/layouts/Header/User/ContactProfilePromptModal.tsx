import { lazy, Suspense, useState } from 'react'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'

const ContactProfilePromptDialog = lazy(() => import('./ContactProfilePromptDialog'))

type Props = {
  user: NonNullable<CurrentUser>
}

export function ContactProfilePromptModal({ user }: Props) {
  const needsContactEmail = !hasContactEmail(user.email)
  // Stays mounted once shown, so the dialog can show its thank-you step after the email was saved.
  const [dialogMounted, setDialogMounted] = useState(needsContactEmail)
  if (needsContactEmail && !dialogMounted) setDialogMounted(true)
  if (!dialogMounted) return null

  return (
    <Suspense fallback={null}>
      <ContactProfilePromptDialog user={user} />
    </Suspense>
  )
}
