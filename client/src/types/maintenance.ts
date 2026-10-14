import type { BadgeTone } from '../components/ui/Badge'
import type { RoomRef } from './room'
import type { TenantRef } from './tenant'

export const MAINTENANCE_CATEGORIES = ['plumbing', 'electrical', 'furniture', 'appliance', 'cleaning', 'other'] as const
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]

export const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number]

export const MAINTENANCE_STATUSES = ['open', 'in_progress', 'resolved', 'cancelled'] as const
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]

export const MAINTENANCE_STATUS_TONE: Record<MaintenanceStatus, BadgeTone> = {
  open: 'warning',
  in_progress: 'primary',
  resolved: 'success',
  cancelled: 'neutral',
}

export const MAINTENANCE_PRIORITY_TONE: Record<MaintenancePriority, BadgeTone> = {
  low: 'neutral',
  medium: 'primary',
  high: 'warning',
  urgent: 'danger',
}

// A maintenance request from the maintenance endpoints: room and tenant are populated.
export type MaintenanceRequest = {
  _id: string
  room: RoomRef
  tenant?: TenantRef | null
  category: MaintenanceCategory
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  dateReported: string
  resolvedAt?: string
  resolutionNotes?: string
  createdAt: string
  updatedAt: string
}

// Inside room details, the room is the page's own room, so it is only an id.
export type RoomMaintenanceRequest = Omit<MaintenanceRequest, 'room'> & { room: string }
