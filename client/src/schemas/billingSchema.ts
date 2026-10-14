import { z } from 'zod'

type BillAmounts = {
  rentAmount: number
  utilityAmount: number
  otherCharges: number
  discount: number
}

// D8: total = rent + utilities + other charges - discount, rounded to centavos (D2).
// The form uses it for the live total preview; the server computes the same.
export function calculateBillTotal(bill: BillAmounts) {
  const total = bill.rentAmount + bill.utilityAmount + bill.otherCharges - bill.discount
  return Math.round(total * 100) / 100
}

const amount = (requiredMessage: string) => z.number({ error: requiredMessage }).min(0, 'Cannot be negative')

// The create/edit bill form. When editing, only the amounts and the due date are sent.
export const billingSchema = z
  .object({
    occupancy: z.string().min(1, 'Choose a tenant and room'),
    billingPeriod: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Choose the billing month'),
    dueDate: z.string().min(1, 'Due date is required'),
    rentAmount: amount('Rent is required'),
    utilityAmount: amount('Enter 0 if there are no utilities'),
    otherCharges: amount('Enter 0 if there are no other charges'),
    discount: amount('Enter 0 if there is no discount'),
  })
  .refine((bill) => calculateBillTotal(bill) >= 0, {
    error: 'Discount cannot exceed total charges',
    path: ['discount'],
  })

export type BillingFormValues = z.infer<typeof billingSchema>
