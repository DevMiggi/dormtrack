import type { TenantRef } from './tenant'

export const PAYMENT_METHODS = ['cash', 'gcash', 'bank_transfer', 'other'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

// How each method is written on screen ("GCash" is a brand name, so formatLabel would get it wrong).
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

// A payment as the API returns it: tenant and bill period are populated.
export type Payment = {
  _id: string
  billing: { _id: string; billingPeriod: string }
  tenant: TenantRef
  amount: number
  paymentDate: string
  method: PaymentMethod
  referenceNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
