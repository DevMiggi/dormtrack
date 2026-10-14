import type { BadgeTone } from '../components/ui/Badge'
import type { TenantBill } from './billing'
import type { TenantOccupancy } from './occupancy'

export const TENANT_STATUSES = ['active', 'inactive'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

export const TENANT_STATUS_TONE: Record<TenantStatus, BadgeTone> = {
  active: 'success',
  inactive: 'neutral',
}

// A tenant as the API returns it. fullName is a virtual from the server.
export type Tenant = {
  _id: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  phone: string
  address?: string
  emergencyContactName: string
  emergencyContactPhone: string
  status: TenantStatus
  createdAt: string
  updatedAt: string
}

// GET /api/tenants/:id (D7)
export type TenantDetails = Tenant & {
  currentOccupancy: TenantOccupancy | null
  occupancyHistory: TenantOccupancy[]
  bills: TenantBill[]
  totalOutstanding: number
}

// A tenant inside another record (populated by the API).
export type TenantRef = {
  _id: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
}
