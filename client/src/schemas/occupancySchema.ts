import { z } from 'zod'
import { toDateInputValue } from '../utils/format'

// Assign a tenant to a room (D4). Dates are "YYYY-MM-DD" strings from <input type="date">,
// so comparing them as text gives the same order as comparing the dates.
export const assignSchema = z
  .object({
    tenant: z.string().min(1, 'Choose a tenant'),
    room: z.string().min(1, 'Choose a room'),
    moveInDate: z.string().min(1, 'Move-in date is required'),
    expectedMoveOutDate: z.string(), // optional: blank means not set
    bedLabel: z.string().trim().max(50, 'Use at most 50 characters'),
    agreedMonthlyRate: z.number({ error: 'Monthly rate is required' }).min(0, 'Cannot be negative'),
    depositAmount: z.number({ error: 'Enter a deposit (0 if none)' }).min(0, 'Cannot be negative'),
    notes: z.string().max(1000, 'Use at most 1000 characters'),
  })
  .refine((values) => values.expectedMoveOutDate === '' || values.expectedMoveOutDate >= values.moveInDate, {
    error: 'Expected move-out cannot be before move-in',
    path: ['expectedMoveOutDate'],
  })

export type AssignFormValues = z.infer<typeof assignSchema>

// Move-out (D5): the date is required and cannot be in the future.
// The server also checks that it is not before the move-in date.
export const moveOutSchema = z.object({
  actualMoveOutDate: z
    .string()
    .min(1, 'Move-out date is required')
    .refine((value) => value <= toDateInputValue(new Date()), 'Move-out date cannot be in the future'),
})

export type MoveOutFormValues = z.infer<typeof moveOutSchema>
