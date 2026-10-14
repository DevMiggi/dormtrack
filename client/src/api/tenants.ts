import type { TenantFormValues } from '../schemas/tenantSchema'
import type { Tenant, TenantDetails } from '../types/tenant'
import api from './axios'

export type TenantFilters = {
  search?: string
  status?: string
}

export async function getTenants(filters: TenantFilters = {}) {
  const response = await api.get<Tenant[]>('/tenants', { params: filters })
  return response.data
}

export async function getTenant(id: string) {
  const response = await api.get<TenantDetails>(`/tenants/${id}`)
  return response.data
}

export async function createTenant(values: TenantFormValues) {
  const response = await api.post<Tenant>('/tenants', values)
  return response.data
}

export async function updateTenant(id: string, values: TenantFormValues) {
  const response = await api.put<Tenant>(`/tenants/${id}`, values)
  return response.data
}

export async function deleteTenant(id: string) {
  await api.delete(`/tenants/${id}`)
}
