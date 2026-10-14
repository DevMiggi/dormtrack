import type { BadgeTone } from '../components/ui/Badge'
import type { RoomRef } from './room'
import type { TenantRef } from './tenant'

// D9: a bill's status is derived by the API on every read, never stored.
export const BILL_STATUSES = ['paid', 'partial', 'unpaid', 'overdue'] as const
export type BillStatus = (typeof BILL_STATUSES)[number]

export const BILL_STATUS_TONE: Record<BillStatus, BadgeTone> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'neutral',
  overdue: 'danger',
}

// A bill as the API returns it: stored amounts plus the D9 derived fields.
export type Billing = {
  _id: string
  occupancy: { _id: string; room: RoomRef }
  tenant: TenantRef
  billingPeriod: string
  rentAmount: number
  utilityAmount: number
  otherCharges: number
  discount: number
  dueDate: string
  createdAt: string
  updatedAt: string
  total: number
  totalPaid: number
  remainingBalance: number
  status: BillStatus
  daysOverdue: number
}

// Inside tenant details, the tenant is the page's own tenant, so it is only an id.
export type TenantBill = Omit<Billing, 'tenant'> & { tenant: string }
