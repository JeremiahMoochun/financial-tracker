import { Request, Response } from "express";
import { Expense } from "../models/expense.model";
import { expenseCategories } from "../models/expenseCategories";

//let expenses: Expense[] = [];

// Add expense
export const addExpense = async (req: Request, res: Response) => {
  try {
    const { amount, category, reason, date } = req.body;

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

    const newExpense = new Expense ({
      amount,
      category,
      reason,
      date,
    });

    await newExpense.save();

    res.status(201).json({
      message: "Expense added successfully",
      expense: newExpense,
    });

  } catch (error) {
  console.error("Error adding expense: ", error);
  res.status(500).json({ message: "Failed to add expense" });
  }
};

  

// View expenses
export const viewExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};


// Edit expense
export const editExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, category, reason, date } = req.body;

    if (category && !expenseCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category." });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { amount, category, reason, date },
      { new: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json({
      message: "Expense updated successfully",
      expense: updatedExpense,
    });

  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
};


// Delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json({
      message: "Expense deleted successfully",
      expense: deletedExpense,
    });

  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};
