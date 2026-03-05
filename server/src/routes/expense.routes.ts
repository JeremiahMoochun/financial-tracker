import express from "express";
import { addExpense } from "..//controllers/expense.controller";

const router = express.Router();

router.post("/", addExpense);

export default router;