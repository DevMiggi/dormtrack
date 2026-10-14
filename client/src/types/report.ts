import type { BillStatus } from './billing'
import type { MaintenancePriority, MaintenanceStatus } from './maintenance'
import type { PaymentMethod } from './payment'
import type { RoomType } from './room'

// GET /api/reports/revenue (D16)
export type RevenueReport = {
  totalCollected: number
  byMonth: { month: string; total: number }[] // month is "YYYY-MM"
  byMethod: { method: PaymentMethod; total: number; count: number }[]
}

// GET /api/reports/occupancy (D16): active rooms only
export type OccupancyReport = {
  overallRate: number
  totalCapacity: number
  totalOccupants: number
  byRoomType: { roomType: RoomType; rooms: number; capacity: number; activeOccupants: number; occupancyRate: number }[]
  rooms: { _id: string; roomNumber: string; roomType: RoomType; capacity: number; activeOccupants: number; occupancyRate: number }[]
}

// GET /api/reports/maintenance (D16)
export type MaintenanceReport = {
  byStatus: { status: MaintenanceStatus; count: number }[]
  byPriority: { priority: MaintenancePriority; count: number }[]
  averageResolutionDays: number | null
  resolvedCount: number
}

// GET /api/reports/outstanding (D16)
export type OutstandingReport = {
  totalOutstanding: number
  bills: {
    _id: string
    tenantName: string
    roomNumber: string
    billingPeriod: string
    dueDate: string
    total: number
    totalPaid: number
    remainingBalance: number
    status: BillStatus
    daysOverdue: number
  }[]
}
