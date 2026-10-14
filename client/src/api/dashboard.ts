import type { DashboardSummary } from '../types/dashboard'
import api from './axios'

export async function getDashboardSummary() {
  const response = await api.get<DashboardSummary>('/dashboard/summary')
  return response.data
}
