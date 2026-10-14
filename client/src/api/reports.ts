import type { MaintenanceReport, OccupancyReport, OutstandingReport, RevenueReport } from '../types/report'
import api from './axios'

// from and to are optional "YYYY-MM-DD" dates; invalid or reversed dates give a 400 (D16).
export async function getRevenueReport(range: { from?: string; to?: string } = {}) {
  const response = await api.get<RevenueReport>('/reports/revenue', { params: range })
  return response.data
}

export async function getOccupancyReport() {
  const response = await api.get<OccupancyReport>('/reports/occupancy')
  return response.data
}

export async function getMaintenanceReport() {
  const response = await api.get<MaintenanceReport>('/reports/maintenance')
  return response.data
}

export async function getOutstandingReport() {
  const response = await api.get<OutstandingReport>('/reports/outstanding')
  return response.data
}
