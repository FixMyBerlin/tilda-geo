import { useUploadFile } from '@better-upload/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import {
  reviewEntriesQueryOptions,
  reviewListsQueryOptions,
} from '@/server/regions/regionQueryOptions'
import type { ReviewListForRegion } from '@/server/review-lists/queries/getReviewListsForRegion.server'
import {
  createReviewEntriesFromGeojsonFn,
  createReviewListFn,
  deleteReviewListFn,
  getReviewListGeojsonFn,
  updateReviewListFn,
} from '@/server/review-lists/review-lists.functions'
import {
  reviewListGeojsonClientMetadataSchema,
  reviewListGeojsonResponseMetadataSchema,
} from '@/server/review-lists/reviewListUpload.schemas'
import { useModeCollectionManager } from '../useModeCollectionManager'

type ReviewListCommandsInput = {
  regionSlug: string
  lists: ReviewListForRegion[]
  selectedListId: number | undefined
  onSelect: (listId: number) => void
}

export const useReviewListCommands = ({
  regionSlug,
  lists,
  selectedListId,
  onSelect,
}: ReviewListCommandsInput) => {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [createdCount, setCreatedCount] = useState<number | null>(null)
  const [nameModal, setNameModal] = useState<'create' | 'rename' | null>(null)
  const successCloseTimerRef = useRef<number | null>(null)

  const { data: listEntries, isSuccess: existingFeaturesReady } = useQuery(
    reviewEntriesQueryOptions(regionSlug, selectedListId),
  )
  const existingFeatures = listEntries?.featureCollection.features ?? []

  const clearSuccessCloseTimer = () => {
    if (successCloseTimerRef.current === null) return
    window.clearTimeout(successCloseTimerRef.current)
    successCloseTimerRef.current = null
  }

  const openNameModal = (kind: 'create' | 'rename', origin?: HTMLElement) => {
    if (origin) captureModalOpenOrigin(origin)
    setNameModal(kind)
  }

  const selectedList = lists.find((list) => list.id === selectedListId)

  const { invalidate, create, rename, remove } = useModeCollectionManager({
    createFn: (name) => createReviewListFn({ data: { regionSlug, name } }),
    renameFn: ({ id, name }) => updateReviewListFn({ data: { regionSlug, listId: id, name } }),
    deleteFn: (id) => deleteReviewListFn({ data: { regionSlug, listId: id } }),
    invalidateKeys: [
      reviewListsQueryOptions(regionSlug).queryKey,
      ['review-lists', 'getReviewEntriesForList'],
    ],
    onAfterCreate: (list) => onSelect(list.id),
  })

  const uploadErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message && error.message !== '[object Object]') {
      return error.message
    }
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
      const { message } = error
      if (typeof message === 'string' && message.length > 0) return message
    }
    return 'Upload fehlgeschlagen'
  }

  const importFromS3 = useMutation({
    mutationFn: (input: { listId: number; s3Key: string; filename: string }) =>
      createReviewEntriesFromGeojsonFn({
        data: {
          regionSlug,
          listId: input.listId,
          s3Key: input.s3Key,
          filename: input.filename,
        },
      }),
    onSuccess: (result) => {
      setUploadError(null)
      setCreatedCount(result.count)
      invalidate()
      clearSuccessCloseTimer()
      successCloseTimerRef.current = window.setTimeout(() => {
        setUploadModalOpen(false)
        setCreatedCount(null)
        successCloseTimerRef.current = null
      }, 1600)
    },
    onError: (error) => {
      setUploadError(uploadErrorMessage(error))
    },
  })

  const { uploadAsync, isPending: isUploading } = useUploadFile({
    api: '/api/review-lists/upload',
    route: 'reviewListGeojson',
    onError: (error) => {
      setUploadError(uploadErrorMessage(error))
    },
    onUploadComplete: async ({ metadata }) => {
      try {
        const parsed = reviewListGeojsonResponseMetadataSchema.parse(metadata)
        await importFromS3.mutateAsync({
          listId: parsed.listId,
          s3Key: parsed.s3Key,
          filename: parsed.filename,
        })
      } catch (error) {
        setUploadError(uploadErrorMessage(error))
      }
    },
  })

  const uploadPending = isUploading || importFromS3.isPending

  const handleDownload = async () => {
    if (selectedListId === undefined) return
    const fc = await getReviewListGeojsonFn({ data: { regionSlug, listId: selectedListId } })
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${selectedList?.name ?? 'pruefliste'}.geojson`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const openUploadModal = (origin?: HTMLElement) => {
    if (origin) captureModalOpenOrigin(origin)
    clearSuccessCloseTimer()
    setUploadError(null)
    setCreatedCount(null)
    setUploadModalOpen(true)
  }

  const closeUploadModal = () => {
    if (uploadPending) return
    clearSuccessCloseTimer()
    setUploadModalOpen(false)
    setCreatedCount(null)
  }

  const uploadGeojsonFile = (file: File) => {
    if (selectedListId === undefined) return
    setUploadError(null)
    void uploadAsync(file, {
      metadata: reviewListGeojsonClientMetadataSchema.parse({
        regionSlug,
        listId: selectedListId,
      }),
    })
  }

  return {
    uploadError,
    setUploadError,
    selectedList,
    nameModal,
    openNameModal,
    closeNameModal: () => setNameModal(null),
    create,
    rename,
    remove,
    uploadPending,
    handleDownload,
    uploadModalOpen,
    openUploadModal,
    closeUploadModal,
    uploadGeojsonFile,
    existingFeatures,
    existingFeaturesReady,
    createdCount,
  }
}

export type ReviewListCommands = ReturnType<typeof useReviewListCommands>
