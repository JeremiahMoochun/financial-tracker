import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Income from '../models/income.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const addIncome = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, reason, date } = req.body;
    const userId = req.user!.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const newIncome = new Income({
      user: userId,
      amount,
      reason,
      date,
    });

    await newIncome.save();

    res.status(201).json({
      message: 'Income added successfully',
      income: newIncome,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const incomes = await Income.find({ user: userId }).sort({ date: -1 });
    res.status(200).json(incomes);
  } catch (error) {
    next(error);
  }
};

export const editIncome = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, reason, date } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid income id' });
    }

    const existing = await Income.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Income not found' });
    }
    if (existing.user.toString() !== userId) {
      return res.status(403).json({ message: 'You are not allowed to edit this income' });
    }

    const updatedIncome = await Income.findByIdAndUpdate(
      id,
      { amount, reason, date },
      { new: true }
    );

    res.status(200).json({
      message: 'Income updated successfully',
      income: updatedIncome,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIncome = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid income id' });
    }

    const existing = await Income.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Income not found' });
    }
    if (existing.user.toString() !== userId) {
      return res.status(403).json({ message: 'You are not allowed to delete this income' });
    }

    const deletedIncome = await Income.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Income deleted successfully',
      income: deletedIncome,
    });
  } catch (error) {
    next(error);
  }
};
