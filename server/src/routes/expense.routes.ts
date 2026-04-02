import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { addExpense, viewExpenses, editExpense, deleteExpense } from '../controllers/expense.controller.js';

const router = express.Router();

router.post('/', authenticate, addExpense);
router.get('/', authenticate, viewExpenses);
router.put('/:id', authenticate, editExpense);
router.delete('/:id', authenticate, deleteExpense);

export default router;
