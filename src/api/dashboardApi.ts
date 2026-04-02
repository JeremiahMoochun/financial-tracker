import { api } from './client';
import type { DashboardSummary } from '../types/dashboard.types';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return api.request<DashboardSummary>('/dashboard/summary');
}
