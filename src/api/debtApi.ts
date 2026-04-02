import { api } from './client';

export interface DebtRecord {
  _id: string;
  label: string;
  counterparty?: string;
  amount: number;
  currency: string;
  direction: 'owed_by_me' | 'owed_to_me';
  dueDate?: string;
  notes?: string;
}

export async function listDebts(): Promise<DebtRecord[]> {
  const res = await api.request<{ debts: DebtRecord[] }>('/debts');
  return res.debts ?? [];
}
