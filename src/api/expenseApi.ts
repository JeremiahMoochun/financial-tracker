import { api } from './client';

export interface ExpensePayload {
  amount: number;
  category: string;
  reason: string;
  date: string;
}

export interface ExpenseRecord {
  _id: string;
  user: string;
  amount: number;
  category: string;
  reason: string;
  date: string;
}

export async function listExpenses(): Promise<ExpenseRecord[]> {
  return api.request<ExpenseRecord[]>('/expense');
}

export async function addExpense(data: ExpensePayload) {
  return api.request<{ message: string; expense: ExpenseRecord }>('/expense', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExpense(id: string, data: Partial<ExpensePayload>) {
  return api.request<{ message: string; expense: ExpenseRecord }>(`/expense/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function removeExpense(id: string) {
  return api.request<{ message: string }>(`/expense/${id}`, {
    method: 'DELETE',
  });
}
