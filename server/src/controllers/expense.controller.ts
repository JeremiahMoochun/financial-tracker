import { Request, Response } from "express";
import { Expense } from "../models/expense.model";
import { expenseCategories } from "../models/expenseCategories";

let expenses: Expense[] = [];

export const addExpense = (req: Request, res: Response) => {
  const { amount, category, reason, date } = req.body;

  // Validation
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required." });
  }

  if (!category) {
    return res.status(400).json({ message: "Category is required." });
  }

  if (!expenseCategories.includes(category)) {
    return res.status(400).json({ message: "Invalid category." });
  }

  if (!reason) {
    return res.status(400).json({ message: "Reason is required." });
  }

  if (!date) {
    return res.status(400).json({ message: "Date is required." });
  }

  const newExpense: Expense = {
    id: Date.now(),
    amount,
    category,
    reason,
    date,
  };

  expenses.push(newExpense);

  res.status(201).json({
    message: "Expense added successfully",
    expense: newExpense,
  });
};
