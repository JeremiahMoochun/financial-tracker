import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import transactionRoutes from './routes/transaction.routes';
import debtRoutes from './routes/debt.routes';
import authRoutes from './routes/auth.routes';
import incomeRoutes from './routes/income.routes';
import expenseRoutes from './routes/expense.routes';
import ghostRoutes from './routes/ghost.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/ghost', ghostRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

export default app;
