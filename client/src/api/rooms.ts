import type { RoomFormValues } from '../schemas/roomSchema'
import type { Room, RoomDetails } from '../types/room'
import api from './axios'

export type RoomFilters = {
  search?: string
  roomType?: string
  conditionStatus?: string
}

// The form keeps amenities as "Aircon, Wifi"; the API expects ["Aircon", "Wifi"].
function toRoomPayload(values: RoomFormValues) {
  const amenities = values.amenities
    .split(',')
    .map((amenity) => amenity.trim())
    .filter((amenity) => amenity !== '')
  return { ...values, amenities }
}

export async function getRooms(filters: RoomFilters = {}) {
  const response = await api.get<Room[]>('/rooms', { params: filters })
  return response.data
}

// Active rooms with their availability (D3). Used to offer only rooms with a free slot.
export async function getRoomsAvailability(filters: { roomType?: string; minAvailableSlots?: number } = {}) {
  const response = await api.get<Room[]>('/rooms/availability', { params: filters })
  return response.data
}

export async function getRoom(id: string) {
  const response = await api.get<RoomDetails>(`/rooms/${id}`)
  return response.data
}

export async function createRoom(values: RoomFormValues) {
  const response = await api.post<Room>('/rooms', toRoomPayload(values))
  return response.data
}

export async function updateRoom(id: string, values: RoomFormValues) {
  const response = await api.put<Room>(`/rooms/${id}`, toRoomPayload(values))
  return response.data
}

export async function deleteRoom(id: string) {
  await api.delete(`/rooms/${id}`)
}
