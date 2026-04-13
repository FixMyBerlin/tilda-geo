import { useMatches } from '@tanstack/react-router'

const regionRouteId = '/regionen/$regionSlug'

export const useHasPermissions = () => {
  const loaderData = useMatches({
    select: (matches) => {
      const match = matches.find((m) => m.routeId === regionRouteId)
      return match?.loaderData as { hasPermissions?: boolean } | undefined
    },
  })
  return loaderData?.hasPermissions ?? false
}
