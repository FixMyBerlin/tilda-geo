import { lazy, Suspense, useState } from 'react'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'

const ContactProfilePromptDialog = lazy(() => import('./ContactProfilePromptDialog'))

type Props = {
  user: NonNullable<CurrentUser>
}

export function ContactProfilePromptModal({ user }: Props) {
  // Decided once per user (the parent keys by user id), so the dialog stays mounted to show its
  // thank-you step after the email was saved.
  const [needsContactEmail] = useState(() => !hasContactEmail(user.email))
  if (!needsContactEmail) return null

  return (
    <Suspense fallback={null}>
      <ContactProfilePromptDialog user={user} />
    </Suspense>
  )
}
