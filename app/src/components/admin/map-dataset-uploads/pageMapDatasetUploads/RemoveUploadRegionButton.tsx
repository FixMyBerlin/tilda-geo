import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AdminTableDeleteButton } from '@/components/admin/AdminTableActions'
import { deleteUploadRegionFn } from '@/server/uploads/uploads.functions'

type Props = {
  uploadSlug: string
  regionSlug: string
}

/** Removes the region↔upload relation only; the region and the upload itself stay intact. */
export function RemoveUploadRegionButton({ uploadSlug, regionSlug }: Props) {
  const router = useRouter()

  const removeRegion = useMutation({
    mutationFn: async () => {
      await deleteUploadRegionFn({ data: { uploadSlug, regionSlug } })
    },
    onSuccess: async () => {
      await router.invalidate()
    },
  })

  return (
    <AdminTableDeleteButton
      label={`Zuordnung zu Region ${regionSlug} entfernen`}
      title="Zuordnung entfernen?"
      description={`Die Zuordnung zwischen Upload „${uploadSlug}“ und Region „${regionSlug}“ wird unwiderruflich entfernt.`}
      confirmLabel="Entfernen"
      onDelete={() => removeRegion.mutateAsync()}
    />
  )
}
