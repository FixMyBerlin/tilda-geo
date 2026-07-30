import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { quote } from '@/components/shared/text/Quotes'
import { toastError } from '@/components/shared/toast/toastError'
import { revokeAdminApiTokenFn } from '@/server/admin/adminApiTokens.functions'

type Props = {
  tokenId: string
  tokenName: string
}

export function RevokeApiTokenButton({ tokenId, tokenName }: Props) {
  const router = useRouter()
  const { mutate, isPending } = useMutation({
    mutationFn: () => revokeAdminApiTokenFn({ data: { id: tokenId } }),
    onSuccess: async () => {
      await router.invalidate()
    },
    onError: (error) => toastError(error, 'Token konnte nicht widerrufen werden'),
  })

  const handleClick = () => {
    if (
      !window.confirm(
        `Token ${quote(tokenName)} unwiderruflich widerrufen? Bereits ausgestellte Konfigurationen mit diesem Token funktionieren danach nicht mehr.`,
      )
    ) {
      return
    }
    mutate()
  }

  return (
    <button
      type="button"
      className="text-sm text-red-700 underline hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? 'Wird widerrufen…' : 'Widerrufen'}
    </button>
  )
}
