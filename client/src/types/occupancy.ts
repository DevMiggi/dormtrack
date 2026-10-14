import type { BadgeTone } from '../components/ui/Badge'
import type { RoomRef } from './room'
import type { TenantRef } from './tenant'

export const OCCUPANCY_STATUSES = ['active', 'completed', 'cancelled'] as const
export type OccupancyStatus = (typeof OCCUPANCY_STATUSES)[number]

export const OCCUPANCY_STATUS_TONE: Record<OccupancyStatus, BadgeTone> = {
  active: 'success',
  completed: 'neutral',
  cancelled: 'neutral',
}

// An occupancy from the occupancy endpoints: tenant and room are populated.
export type Occupancy = {
  _id: string
  tenant: TenantRef
  room: RoomRef
  bedLabel?: string
  moveInDate: string
  expectedMoveOutDate?: string
  actualMoveOutDate?: string
  depositAmount: number
  agreedMonthlyRate: number
  status: OccupancyStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// Inside room details, the room is the page's own room, so it is only an id.
export type RoomOccupancy = Omit<Occupancy, 'room'> & { room: string }

// Inside tenant details, the tenant is the page's own tenant, so it is only an id.
export type TenantOccupancy = Omit<Occupancy, 'tenant'> & { tenant: string }
