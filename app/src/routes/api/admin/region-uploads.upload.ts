import { handleRequest, RejectUpload, type Router, route } from '@better-upload/server'
import { createFileRoute } from '@tanstack/react-router'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { createRegionUpload } from '@/server/regions/uploads/createRegionUpload.server'
import {
  regionLogoClientMetadataSchema,
  regionLogoResponseMetadataSchema,
} from '@/server/regions/uploads/regionLogoUpload.schemas'
import {
  REGION_UPLOAD_ACCEPTED_MIME_TYPES,
  REGION_UPLOAD_MAX_FILE_SIZE_BYTES,
} from '@/server/regions/uploads/regionUploadImage.const'
import { regionUploadKey } from '@/server/regions/uploads/regionUploadsS3.server'
import { getConfiguredS3Client } from '@/server/s3Client.server'

const regionUploadLimits = {
  fileTypes: [...REGION_UPLOAD_ACCEPTED_MIME_TYPES],
  maxFileSize: REGION_UPLOAD_MAX_FILE_SIZE_BYTES,
}

const regionUploadRoute = ({
  fileTypes,
  maxFileSize,
}: {
  fileTypes: string[]
  maxFileSize: number
}) =>
  route({
    fileTypes,
    maxFileSize,
    // Client → server: region context via uploadAsync(..., { metadata }).
    // Better Upload expects a static `api` URL, so region is not path-scoped;
    // the file alone also does not say which region the upload belongs to.
    clientMetadataSchema: regionLogoClientMetadataSchema,
    onBeforeUpload: async ({ req, clientMetadata, file }) => {
      const admin = await requireAdmin(req.headers).catch((error: unknown) => {
        // RejectUpload → HTTP 400 with `{ error: { message } }` for @better-upload/client.
        // Plain AuthorizationError would escape handleRequest as an opaque 500.
        if (error instanceof AuthorizationError) {
          throw new RejectUpload(error.message)
        }
        throw error
      })
      const auditContext = adminFormAuditContext(req.headers, admin.userId)
      const region = await db.region.findUnique({
        where: { id: clientMetadata.regionId },
        select: { slug: true },
      })
      if (!region) {
        throw new RejectUpload('Region nicht gefunden')
      }
      if (region.slug !== clientMetadata.regionSlug) {
        throw new RejectUpload('Region-Slug stimmt nicht mit der Region-ID überein')
      }
      const uuid = crypto.randomUUID()
      return {
        objectInfo: {
          key: regionUploadKey({
            regionSlug: region.slug,
            uuid,
            filename: file.name,
          }),
        },
        // Server-internal handoff → onAfterSignedUrl (create DB row after S3 key is known).
        metadata: {
          regionId: clientMetadata.regionId,
          title: file.name,
          mimeType: file.type,
          fileSize: file.size,
          createdById: admin.userId,
          auditIpAddress: auditContext.ipAddress,
          auditUserAgent: auditContext.userAgent,
        },
      }
    },
    onAfterSignedUrl: async ({ file, metadata }) => {
      const created = await createRegionUpload(
        {
          regionId: metadata.regionId,
          s3Key: file.objectInfo.key,
          title: metadata.title,
          mimeType: metadata.mimeType,
          fileSize: metadata.fileSize,
          createdById: metadata.createdById,
        },
        {
          userId: metadata.createdById,
          ipAddress: metadata.auditIpAddress,
          userAgent: metadata.auditUserAgent,
          metadata: { changeSource: 'ADMIN_FORM' },
        },
      )
      // Server → client (onUploadComplete): so the form can set headerLogoId / welcomeImageUploadId.
      return {
        metadata: regionLogoResponseMetadataSchema.parse({
          regionUploadId: created.id,
          title: created.title,
        }),
      }
    },
  })

const router: Router = {
  client: getConfiguredS3Client(),
  bucketName: process.env.S3_BUCKET,
  routes: {
    // Shared by logo + welcome hero pickers (same limits and metadata).
    regionUpload: regionUploadRoute(regionUploadLimits),
  },
}

export const Route = createFileRoute('/api/admin/region-uploads/upload')({
  ssr: false,
  server: {
    handlers: {
      POST: ({ request }) => handleRequest(request, router),
    },
  },
})
