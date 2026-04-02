import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Expense } from '../models/expense.model.js';
import { expenseCategories } from '../models/expenseCategories.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const addExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, category, reason, date } = req.body;
    const userId = req.user!.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required.' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Category is required.' });
    }

    if (!expenseCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required.' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const newExpense = new Expense({
      user: userId,
      amount,
      category,
      reason,
      date,
    });

    await newExpense.save();

    res.status(201).json({
      message: 'Expense added successfully',
      expense: newExpense,
    });
  } catch (error) {
    next(error);
  }
};

export const viewExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
};

export const editExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, category, reason, date } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid expense id.' });
    }

    if (category && !expenseCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' });
    }

    const existing = await Expense.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found.' });
    }
    if (existing.user.toString() !== userId) {
      return res.status(403).json({ message: 'You are not allowed to edit this expense.' });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { amount, category, reason, date },
      { new: true }
    );

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid expense id.' });
    }

    const existing = await Expense.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Expense not found.' });
    }
    if (existing.user.toString() !== userId) {
      return res.status(403).json({ message: 'You are not allowed to delete this expense.' });
    }

    const deletedExpense = await Expense.findByIdAndDelete(id);

    res.json({
      message: 'Expense deleted successfully',
      expense: deletedExpense,
    });
  } catch (error) {
    next(error);
  }
};
