import { Router } from "express";
import { addIncome, editIncome, deleteIncome, getIncomes } from "../controllers/income.controller"; 

const router = Router();

router.get("/", getIncomes);
router.post("/", addIncome);
router.put("/:id", editIncome);
router.delete("/:id", deleteIncome);

export default router;