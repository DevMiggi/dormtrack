import { z } from 'zod'
import { CAPACITY_BY_TYPE, ROOM_CONDITIONS, ROOM_TYPES } from '../types/room'

// The add/edit room form. The same limits as the Room model on the server (§3, D6).
export const roomSchema = z
  .object({
    roomNumber: z.string().trim().min(1, 'Room number is required').max(30, 'Use at most 30 characters'),
    floor: z.string().trim().min(1, 'Floor is required').max(50, 'Use at most 50 characters'),
    roomType: z.enum(ROOM_TYPES, { error: 'Choose a room type' }),
    capacity: z.number({ error: 'Capacity is required' }).int('Use a whole number').min(1, 'At least 1').max(20, 'At most 20'),
    monthlyRate: z.number({ error: 'Monthly rate is required' }).min(0, 'Cannot be negative'),
    amenities: z.string().max(500, 'Use at most 500 characters'), // comma-separated in the form
    conditionStatus: z.enum(ROOM_CONDITIONS, { error: 'Choose a status' }),
    notes: z.string().max(1000, 'Use at most 1000 characters'),
  })
  .refine(
    (room) => {
      const limits = CAPACITY_BY_TYPE[room.roomType]
      return room.capacity >= limits.min && room.capacity <= limits.max
    },
    { error: 'Capacity must match the type: single = 1, double = 2, shared = 3 to 20', path: ['capacity'] }
  )

export type RoomFormValues = z.infer<typeof roomSchema>
