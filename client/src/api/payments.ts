import type { PaymentFormValues } from '../schemas/paymentSchema'
import type { Billing } from '../types/billing'
import type { Payment } from '../types/payment'
import api from './axios'

export type PaymentFilters = {
  billing?: string
  tenant?: string
  method?: string
  from?: string
  to?: string
}

export async function getPayments(filters: PaymentFilters = {}) {
  const response = await api.get<Payment[]>('/payments', { params: filters })
  return response.data
}

// D11: the response has the payment and the bill with its balance recomputed.
export async function createPayment(values: PaymentFormValues) {
  const response = await api.post<{ payment: Payment; billing: Billing }>('/payments', values)
  return response.data
}

// There is no update: a wrong payment is deleted and recorded again (§5).
export async function deletePayment(id: string) {
  await api.delete(`/payments/${id}`)
}
