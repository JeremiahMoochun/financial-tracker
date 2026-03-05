import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { json } from 'body-parser';
import { errorHandler } from './middleware/error.middleware';
import transactionRoutes from './routes/transaction.routes';
import debtRoutes from './routes/debt.routes';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/transaction.routes';

const app = express();

app.use(cors());
app.use(json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/expense', expenseRoutes);

app.use(errorHandler);

app.listen(8080, () => {
  console.log("Server running on port 8080");
});

export default app;

