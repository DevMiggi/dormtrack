import type { RoomType } from './room'

// GET /api/dashboard/summary (D15). Capacity numbers count active rooms only.
export type DashboardSummary = {
  totalRooms: number
  totalCapacity: number
  occupiedSlots: number
  vacantSlots: number
  occupancyRate: number
  collectionsThisMonth: number
  totalOutstanding: number
  overdueCount: number
  openMaintenance: { total: number; urgent: number } // open + in_progress
  roomsNearCapacity: {
    _id: string
    roomNumber: string
    roomType: RoomType
    capacity: number
    activeOccupants: number
    availableSlots: number
    occupancyRate: number
  }[]
}
