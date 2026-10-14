import type { BadgeTone } from '../components/ui/Badge'
import type { RoomMaintenanceRequest } from './maintenance'
import type { RoomOccupancy } from './occupancy'

export const ROOM_TYPES = ['single', 'double', 'shared'] as const
export type RoomType = (typeof ROOM_TYPES)[number]

export const ROOM_CONDITIONS = ['active', 'maintenance', 'inactive'] as const
export type RoomCondition = (typeof ROOM_CONDITIONS)[number]

// D6: the capacity each room type allows (the server checks the same rule).
export const CAPACITY_BY_TYPE: Record<RoomType, { min: number; max: number }> = {
  single: { min: 1, max: 1 },
  double: { min: 2, max: 2 },
  shared: { min: 3, max: 20 },
}

export const ROOM_CONDITION_TONE: Record<RoomCondition, BadgeTone> = {
  active: 'success',
  maintenance: 'neutral',
  inactive: 'neutral',
}

// A room as the API returns it: the stored fields plus the D3 availability fields.
export type Room = {
  _id: string
  roomNumber: string
  floor: string
  roomType: RoomType
  capacity: number
  monthlyRate: number
  amenities: string[]
  conditionStatus: RoomCondition
  notes?: string
  createdAt: string
  updatedAt: string
  activeOccupants: number
  availableSlots: number
  occupancyRate: number
  isAvailable: boolean
}

// GET /api/rooms/:id (D14)
export type RoomDetails = Room & {
  currentTenants: RoomOccupancy[]
  occupancyHistory: RoomOccupancy[]
  maintenanceHistory: RoomMaintenanceRequest[]
}

// A room inside another record (populated by the API).
export type RoomRef = {
  _id: string
  roomNumber: string
  floor?: string
  roomType?: RoomType
}
