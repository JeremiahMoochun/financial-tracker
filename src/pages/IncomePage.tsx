import { useEffect, useState } from 'react';
import { addIncome, listIncomes, removeIncome, type IncomeRequest } from '../api/incomeApi';
import type { IncomeRecord } from '../api/incomeApi';

const IncomePage = () => {
  const [rows, setRows] = useState<IncomeRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    listIncomes()
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
      setError('All fields are required.');
      return;
    }

    const payload: IncomeRequest = {
      amount: Number(amount),
      reason,
      date,
    };

    try {
      await addIncome(payload);
      setMessage('Income added successfully.');
      setAmount('');
      setReason('');
      setDate('');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add income.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this income entry?')) return;
    setError('');
    try {
      await removeIncome(id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  if (loading) {
    return <p className="text-muted">Loading income…</p>;
  }

  return (
    <div className="container-fluid px-0">
      <h2 className="mb-3">Income</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h5 card-title">Add income</h3>
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
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Reason"
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
                  Add income
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h5 card-title">Your income</h3>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-muted">
                          No income entries yet.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r._id}>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
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
};

export default IncomePage;
