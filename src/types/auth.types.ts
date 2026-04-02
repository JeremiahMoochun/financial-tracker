export interface SavingsGoal {
  label: string;
  target?: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  homeCurrency?: string;
  semesterStart?: string;
  semesterEnd?: string;
  savingsGoalLabel?: string;
  savingsGoalTarget?: number;
  savingsGoals?: SavingsGoal[];
  jobTitle?: string;
  /** false = must finish baseline onboarding (new accounts) */
  onboardingComplete?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}
