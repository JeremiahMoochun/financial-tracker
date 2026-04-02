import { api } from './client';
import type { GhostOverview } from '../types/dashboard.types';

export async function fetchGhostOverview(): Promise<GhostOverview> {
  return api.request<GhostOverview>('/ghost/overview');
}
