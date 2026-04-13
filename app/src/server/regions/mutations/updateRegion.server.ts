import { isRedirect, redirect } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import type { FormState } from '@/server/utils/validation'
import {
  errorState,
  extractAndValidateFormData,
  validationErrorState,
} from '@/server/utils/validation'
import { RegionFormSchema } from '../schemas'

export async function updateRegionWithData(
  data: z.infer<typeof RegionFormSchema>,
  headers: Headers,
) {
  try {
    await requireAdmin(headers)
    const { slug, ...updateData } = data
    await db.region.update({ where: { slug }, data: updateData })
    return { success: true, message: '', errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    return errorState(error, 'Fehler beim Aktualisieren der Region')
  }
}

export async function updateRegion(_prevState: FormState | null, formData: FormData) {
  try {
    const parsed = extractAndValidateFormData(formData, RegionFormSchema)
    const result = await updateRegionWithData(parsed, getRequestHeaders())
    if (result.success) throw redirect({ to: '/admin/regions' })
    return result
  } catch (error) {
    if (error instanceof z.ZodError) return validationErrorState(error)
    if (isRedirect(error)) throw error
    return errorState(error, 'Fehler beim Aktualisieren der Region')
  }
}
