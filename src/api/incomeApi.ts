import axios from "axios";

const API_URL = "http://localhost:8080/api/income";

export interface IncomeRequest {
  amount: number;
  reason: string;
  date: string;
}

export const addIncome = async (data: IncomeRequest) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to add income";
  };
  
};
