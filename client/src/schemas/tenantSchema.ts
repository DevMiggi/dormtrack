import { z } from 'zod'
import { TENANT_STATUSES } from '../types/tenant'

// D1: Philippine mobile number, e.g. 09171234567.
const PH_MOBILE = /^09\d{9}$/
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_MESSAGE = 'Use 11 digits starting with 09, e.g. 09171234567'

// The add/edit tenant form. The same limits as the Tenant model on the server (§3, D1).
export const tenantSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80, 'Use at most 80 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(80, 'Use at most 80 characters'),
  // Optional: leave it blank, or give a valid address.
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || EMAIL_FORMAT.test(value), 'Enter a valid email address'),
  phone: z.string().trim().min(1, 'Phone is required').regex(PH_MOBILE, PHONE_MESSAGE),
  address: z.string().trim().max(300, 'Use at most 300 characters'),
  emergencyContactName: z
    .string()
    .trim()
    .min(1, 'Emergency contact name is required')
    .max(160, 'Use at most 160 characters'),
  emergencyContactPhone: z.string().trim().min(1, 'Emergency contact phone is required').regex(PH_MOBILE, PHONE_MESSAGE),
  status: z.enum(TENANT_STATUSES, { error: 'Choose a status' }),
})

export type TenantFormValues = z.infer<typeof tenantSchema>
