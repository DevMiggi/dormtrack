import { z } from 'zod'
import { MAINTENANCE_CATEGORIES, MAINTENANCE_PRIORITIES } from '../types/maintenance'
import { toDateInputValue } from '../utils/format'

// Report or edit a maintenance request. Status is not here: it changes only through the status buttons (D13).
export const maintenanceSchema = z.object({
  room: z.string().min(1, 'Choose a room'),
  tenant: z.string(), // optional: blank means no tenant
  category: z.enum(MAINTENANCE_CATEGORIES, { error: 'Choose a category' }),
  priority: z.enum(MAINTENANCE_PRIORITIES, { error: 'Choose a priority' }),
  description: z.string().trim().min(1, 'Describe the problem').max(1000, 'Use at most 1000 characters'),
  dateReported: z
    .string()
    .min(1, 'Date reported is required')
    .refine((value) => value <= toDateInputValue(new Date()), 'Date reported cannot be in the future'),
})

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

// D13: resolving needs notes about what was done.
export const resolveSchema = z.object({
  resolutionNotes: z.string().trim().min(1, 'Describe how it was resolved').max(1000, 'Use at most 1000 characters'),
})

export type ResolveFormValues = z.infer<typeof resolveSchema>
