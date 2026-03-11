 import { Request, Response } from "express";
 import Income from "../models/income.model";

 // Add income
export const addIncome = async(req: Request, res: Response) => {
    try {
        const { amount, reason, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Valid amount required" });
        }

        if (!reason) {
            return res.status(400).json({ message: "Reason is required" });
        }

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const newIncome = new Income({
            amount,
            reason,
            date
        });

        await newIncome.save();

        res.status(201).json({
            message: "Income added successfully",
            income: newIncome
        });
    } catch (error) {
        console.error("Error adding income: ", error);
        res.status(500).json({ message: "Failed to add income" });
    }
};

  // Get income
  export const getIncomes = async (req: Request, res: Response) => {
  try {
    const incomes = await Income.find();  
    res.status(200).json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({ message: "Failed to fetch incomes" });
  }
};

// Edit income
export const editIncome = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason, date } = req.body;

    const updatedIncome = await Income.findByIdAndUpdate(
      id,
      { amount, reason, date },
      { new: true }
    );

    if (!updatedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.status(200).json({
      message: "Income updated successfully",
      income: updatedIncome
    });

  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ message: "Failed to update income" });
  }
};


// Delete income
export const deleteIncome = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedIncome = await Income.findByIdAndDelete(id);

    if (!deletedIncome) {
      return res.status(404).json({ message: "Income not found" });
    }

    res.status(200).json({
      message: "Income deleted successfully",
      income: deletedIncome
    });

  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ message: "Failed to delete income" });
  }
};