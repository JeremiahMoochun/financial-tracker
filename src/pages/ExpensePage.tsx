import { useEffect, useState } from 'react';
import {
  listExpenses,
  addExpense,
  removeExpense,
  type ExpensePayload,
  type ExpenseRecord,
} from '../api/expenseApi';

const CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Other',
];

export default function ExpensePage() {
  const [rows, setRows] = useState<ExpenseRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    listExpenses()
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!amount || !reason || !date) {
      setError('Amount, reason, and date are required.');
      return;
    }
    const payload: ExpensePayload = {
      amount: Number(amount),
      category,
      reason,
      date,
    };
    try {
      await addExpense(payload);
      setMessage('Expense saved.');
      setAmount('');
      setReason('');
      setDate('');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add expense.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    setError('');
    try {
      await removeExpense(id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  if (loading) {
    return <p className="text-muted">Loading expenses…</p>;
  }

  return (
    <div className="container-fluid px-0">
      <h2 className="mb-3">Expenses</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h5 card-title">Add expense</h3>
              <form onSubmit={handleSubmit}>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="form-control mb-2"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <label className="form-label">Category</label>
                <select
                  className="form-select mb-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label className="form-label">Reason</label>
                <input
                  className="form-control mb-2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control mb-3"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Save expense
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h5 card-title">Your expenses</h3>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted">
                          No expenses yet.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r._id}>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.category}</td>
                          <td>{r.amount.toFixed(2)}</td>
                          <td>{r.reason}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(r._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
