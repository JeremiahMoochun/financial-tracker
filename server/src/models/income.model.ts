import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  reason: { type: String },                 
  date: { type: Date, required: true }
});

const Income = mongoose.model("Income", incomeSchema);
export default Income;