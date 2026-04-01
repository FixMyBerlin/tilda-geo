import { getRouteApi } from '@tanstack/react-router'
import { UserForm } from './UserForm'

const routeApi = getRouteApi('/_pages/settings/user')

export function PageSettingsUser() {
  const { user } = routeApi.useLoaderData()
  return (
    <>
      <h1>Account bearbeiten</h1>
      <UserForm user={user} />
    </>
  )
}
