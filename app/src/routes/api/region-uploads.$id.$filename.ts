import { createFileRoute } from '@tanstack/react-router'
import { UserRoleEnum } from '@/prisma/generated/client'
import { proxyS3Url } from '@/server/api/uploads/proxyS3Url.server'
import { getFreshSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { s3VirtualHostedUrl } from '@/server/s3VirtualHostedUrl.server'

/**
 * Proxy for a region upload (e.g. header logos). Public when the upload is the active
 * `headerLogoId` of a region; admins may also fetch unreferenced uploads (form preview before save).
 * The `$filename` segment is cosmetic.
 */
export const Route = createFileRoute('/api/region-uploads/$id/$filename')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const id = Number(params.id)
        if (!Number.isInteger(id)) {
          return Response.json({ message: 'Not found' }, { status: 404 })
        }

        const upload = await db.regionUpload.findUnique({
          where: { id },
          select: { s3Key: true },
        })
        if (!upload) {
          return Response.json({ message: 'Not found' }, { status: 404 })
        }

        // Public only when this upload is the active header logo of a PUBLIC region. Logos of
        // PRIVATE/DEACTIVATED regions (and unreferenced uploads) require admin — otherwise a
        // private region's branding leaks to anyone enumerating the integer id.
        const referencedByPublicRegion = await db.region.count({
          where: { headerLogoId: id, status: 'PUBLIC' },
        })
        const referencedByPublicWelcomeImage = await db.region.count({
          where: {
            welcomeImageUploadId: id,
            status: 'PUBLIC',
            welcomeEnabled: true,
          },
        })
        if (referencedByPublicRegion === 0 && referencedByPublicWelcomeImage === 0) {
          const session = await getFreshSession(request.headers)
          if (session?.role !== UserRoleEnum.ADMIN) {
            return Response.json({ message: 'Not found' }, { status: 404 })
          }
        }

        const url = s3VirtualHostedUrl({ bucket: process.env.S3_BUCKET, key: upload.s3Key })
        return proxyS3Url(request, url)
      },
    },
  },
})
