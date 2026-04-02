import { api } from './client';

export interface IncomeRequest {
  amount: number;
  reason: string;
  date: string;
}

export interface IncomeRecord {
  _id: string;
  user: string;
  amount: number;
  reason: string;
  date: string;
}

export async function listIncomes(): Promise<IncomeRecord[]> {
  return api.request<IncomeRecord[]>('/income');
}

export async function addIncome(data: IncomeRequest) {
  return api.request<{ message: string; income: IncomeRecord }>('/income', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIncome(id: string, data: Partial<IncomeRequest>) {
  return api.request<{ message: string; income: IncomeRecord }>(`/income/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function removeIncome(id: string) {
  return api.request<{ message: string }>(`/income/${id}`, {
    method: 'DELETE',
  });
}
