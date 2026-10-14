import type { MaintenanceFormValues } from '../schemas/maintenanceSchema'
import type { MaintenanceRequest, MaintenanceStatus } from '../types/maintenance'
import api from './axios'

export type MaintenanceFilters = {
  status?: string
  priority?: string
  room?: string
}

export async function getMaintenanceRequests(filters: MaintenanceFilters = {}) {
  const response = await api.get<MaintenanceRequest[]>('/maintenance-requests', { params: filters })
  return response.data
}

export async function createMaintenanceRequest(values: MaintenanceFormValues) {
  const response = await api.post<MaintenanceRequest>('/maintenance-requests', values)
  return response.data
}

// PUT never changes the status (D13).
export async function updateMaintenanceRequest(id: string, values: MaintenanceFormValues) {
  const response = await api.put<MaintenanceRequest>(`/maintenance-requests/${id}`, values)
  return response.data
}

// D13: the server allows only valid moves, and resolving needs resolutionNotes.
export async function changeMaintenanceStatus(id: string, status: MaintenanceStatus, resolutionNotes?: string) {
  const response = await api.patch<MaintenanceRequest>(`/maintenance-requests/${id}/status`, { status, resolutionNotes })
  return response.data
}

export async function deleteMaintenanceRequest(id: string) {
  await api.delete(`/maintenance-requests/${id}`)
}
