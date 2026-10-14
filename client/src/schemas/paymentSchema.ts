import { z } from 'zod'
import { PAYMENT_METHODS } from '../types/payment'
import { toDateInputValue } from '../utils/format'

// Record a payment (D11). The server also checks that the amount is not above the bill's remaining balance.
export const paymentSchema = z.object({
  billing: z.string().min(1, 'Choose a bill'),
  amount: z.number({ error: 'Amount is required' }).min(0.01, 'Amount must be at least ₱0.01'),
  paymentDate: z
    .string()
    .min(1, 'Payment date is required')
    .refine((value) => value <= toDateInputValue(new Date()), 'Payment date cannot be in the future'),
  method: z.enum(PAYMENT_METHODS, { error: 'Choose a payment method' }),
  referenceNumber: z.string().trim().max(100, 'Use at most 100 characters'),
  notes: z.string().trim().max(500, 'Use at most 500 characters'),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>
