import type { AssignFormValues } from '../schemas/occupancySchema'
import type { Occupancy } from '../types/occupancy'
import api from './axios'

export type OccupancyFilters = {
  status?: string
  room?: string
  tenant?: string
}

export async function getOccupancies(filters: OccupancyFilters = {}) {
  const response = await api.get<Occupancy[]>('/occupancies', { params: filters })
  return response.data
}

export async function createOccupancy(values: AssignFormValues) {
  // A blank expected move-out date is left out instead of being sent as "".
  const payload = { ...values, expectedMoveOutDate: values.expectedMoveOutDate || undefined }
  const response = await api.post<Occupancy>('/occupancies', payload)
  return response.data
}

export async function completeOccupancy(id: string, actualMoveOutDate: string) {
  const response = await api.patch<Occupancy>(`/occupancies/${id}/complete`, { actualMoveOutDate })
  return response.data
}

export async function cancelOccupancy(id: string) {
  const response = await api.patch<Occupancy>(`/occupancies/${id}/cancel`)
  return response.data
}
