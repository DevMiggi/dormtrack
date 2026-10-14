import type { BillingFormValues } from '../schemas/billingSchema'
import type { Billing } from '../types/billing'
import api from './axios'

export type BillingFilters = {
  billingPeriod?: string
  status?: string
  tenant?: string
}

export async function getBillings(filters: BillingFilters = {}) {
  const response = await api.get<Billing[]>('/billings', { params: filters })
  return response.data
}

// D9: overdue bills only, most overdue first.
export async function getOverdueBillings() {
  const response = await api.get<Billing[]>('/billings/overdue')
  return response.data
}

export async function createBilling(values: BillingFormValues) {
  const response = await api.post<Billing>('/billings', values)
  return response.data
}

// PUT may change only the amounts and the due date (occupancy, tenant and period stay fixed).
export async function updateBilling(id: string, values: BillingFormValues) {
  const { rentAmount, utilityAmount, otherCharges, discount, dueDate } = values
  const response = await api.put<Billing>(`/billings/${id}`, { rentAmount, utilityAmount, otherCharges, discount, dueDate })
  return response.data
}

export async function deleteBilling(id: string) {
  await api.delete(`/billings/${id}`)
}
