import { handleRequest, RejectUpload, type Router, route } from '@better-upload/server'
import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import { assertListInRegion } from '@/server/review-lists/queries/assertListInRegion.server'
import {
  reviewListGeojsonClientMetadataSchema,
  reviewListGeojsonResponseMetadataSchema,
} from '@/server/review-lists/reviewListUpload.schemas'
import { reviewListUploadKey } from '@/server/review-lists/reviewListUploadsS3.server'
import { getConfiguredS3Client } from '@/server/s3Client.server'

/** 10 MB — enough for multi-thousand-feature GeoJSON; feature count is capped separately. */
const REVIEW_LIST_GEOJSON_MAX_BYTES = 10 * 1024 * 1024

const isGeojsonFilename = (name: string) => /\.(geojson|json)$/i.test(name)

const router: Router = {
  client: getConfiguredS3Client(),
  bucketName: process.env.S3_BUCKET,
  routes: {
    reviewListGeojson: route({
      // Omit fileTypes: macOS often sends empty MIME for .geojson; validate by extension instead.
      maxFileSize: REVIEW_LIST_GEOJSON_MAX_BYTES,
      clientMetadataSchema: reviewListGeojsonClientMetadataSchema,
      onBeforeUpload: async ({ req, clientMetadata, file }) => {
        if (!isGeojsonFilename(file.name)) {
          throw new RejectUpload('Nur GeoJSON-Dateien (.geojson, .json) sind erlaubt')
        }

        let session
        try {
          session = await requireAuth(req.headers)
          await authorizeRegionMemberByRegionSlug(session, clientMetadata.regionSlug)
          await assertListInRegion(clientMetadata.listId, clientMetadata.regionSlug)
        } catch (error) {
          throw new RejectUpload(error instanceof Error ? error.message : 'Nicht berechtigt')
        }

        const uuid = crypto.randomUUID()
        const key = reviewListUploadKey({
          regionSlug: clientMetadata.regionSlug,
          listId: clientMetadata.listId,
          uuid,
          filename: file.name,
        })

        return {
          objectInfo: { key },
          metadata: {
            regionSlug: clientMetadata.regionSlug,
            listId: clientMetadata.listId,
            s3Key: key,
            filename: file.name,
          },
        }
      },
      onAfterSignedUrl: async ({ file, metadata }) => ({
        metadata: reviewListGeojsonResponseMetadataSchema.parse({
          regionSlug: metadata.regionSlug,
          listId: metadata.listId,
          filename: metadata.filename,
          s3Key: file.objectInfo.key,
        }),
      }),
    }),
  },
}

export const Route = createFileRoute('/api/review-lists/upload')({
  ssr: false,
  server: {
    handlers: {
      POST: ({ request }) => handleRequest(request, router),
    },
  },
})
