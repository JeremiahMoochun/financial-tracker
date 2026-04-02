import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { validationResult, body } from 'express-validator';
import { User, type IUser } from '../models/User.model.js';
import { BlacklistedToken } from '../models/BlacklistedToken.model.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateToken, decodeToken } from '../utils/generateToken.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Expense } from '../models/expense.model.js';
import Income from '../models/income.model.js';
import { Debt } from '../models/Debt.model.js';
import { expenseCategories } from '../models/expenseCategories.js';
import {
  baselineDebtNotes,
  baselineExpenseReason,
  baselineIncomeReason,
  BASELINE_DEBT_NOTES_PREFIX,
  BASELINE_EXPENSE_REASON_PREFIX,
  BASELINE_INCOME_REASON_PREFIX,
} from '../utils/baselineMarkers.js';

export const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').optional().trim().isLength({ max: 50 }),
];

export async function register(req: Request, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please start MongoDB and restart the server.' });
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }
  const { email, password, displayName } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already exists.' });
      return;
    }
    const hashed = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashed,
      displayName: displayName || '',
      onboardingComplete: false,
    });
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        onboardingComplete: false,
      },
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ message: 'Email already exists.' });
      return;
    }
    const isDbDown = mongoose.connection.readyState !== 1;
    res.status(isDbDown ? 503 : 500).json({
      message: isDbDown ? 'Database not connected. Please start MongoDB and restart the server.' : 'Registration failed. Please try again.',
    });
  }
}

export const loginValidation = [body('email').isEmail(), body('password').notEmpty()];

export async function login(req: Request, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please start MongoDB and restart the server.' });
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Invalid email or password.' });
    return;
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await comparePassword(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }
    const token = generateToken(user._id.toString());
    res.json({
      message: 'Login successful',
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const decoded = decodeToken(token);
      if (decoded?.exp) {
        await BlacklistedToken.create({ token, expiresAt: new Date(decoded.exp * 1000) });
      }
    } catch {}
  }
  res.json({ message: 'Logged out successfully' });
}

function serializeUser(user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  displayName?: string;
  homeCurrency?: string;
  semesterStart?: Date;
  semesterEnd?: Date;
  savingsGoalLabel?: string;
  savingsGoalTarget?: number;
  savingsGoals?: { label?: string; target?: number }[];
  jobTitle?: string;
  onboardingComplete?: boolean;
}) {
  const onboardingDone = user.onboardingComplete !== false;
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    homeCurrency: user.homeCurrency,
    semesterStart: user.semesterStart,
    semesterEnd: user.semesterEnd,
    savingsGoalLabel: user.savingsGoalLabel || '',
    savingsGoalTarget: user.savingsGoalTarget,
    savingsGoals: (user.savingsGoals || [])
      .filter((g) => g?.label)
      .map((g) => ({ label: g.label as string, target: g.target })),
    jobTitle: user.jobTitle || '',
    onboardingComplete: onboardingDone,
  };
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = req.body as {
      displayName?: string;
      savingsGoalLabel?: string;
      savingsGoalTarget?: number | null;
      jobTitle?: string;
      savingsGoals?: { label?: string; target?: number }[];
    };
    const { displayName, savingsGoalLabel, savingsGoalTarget, jobTitle, savingsGoals } = body;
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (displayName !== undefined) {
      user.displayName = String(displayName).trim().slice(0, 50);
    }
    if (savingsGoalLabel !== undefined) {
      user.savingsGoalLabel = String(savingsGoalLabel).trim().slice(0, 100);
    }
    if (savingsGoalTarget !== undefined) {
      user.savingsGoalTarget =
        savingsGoalTarget === null || savingsGoalTarget === undefined || Number(savingsGoalTarget) <= 0
          ? undefined
          : Number(savingsGoalTarget);
    }
    if (jobTitle !== undefined) {
      user.jobTitle = String(jobTitle).trim().slice(0, 100);
    }
    if (Array.isArray(savingsGoals)) {
      user.savingsGoals = savingsGoals
        .filter((g) => g?.label && String(g.label).trim())
        .slice(0, 4)
        .map((g) => ({
          label: String(g.label).trim().slice(0, 80),
          target: g.target != null && Number(g.target) > 0 ? Number(g.target) : undefined,
        }));
    }
    await user.save();
    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

const ONBOARDING_EXPENSE_FIELDS: { key: string; category: string }[] = [
  { key: 'rent', category: 'Rent' },
  { key: 'utilities', category: 'Utilities' },
  { key: 'food', category: 'Food' },
  { key: 'transport', category: 'Transport' },
  { key: 'entertainment', category: 'Entertainment' },
  { key: 'healthcare', category: 'Healthcare' },
  { key: 'education', category: 'Education' },
  { key: 'other', category: 'Other' },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ExpenseRowInput {
  category: string;
  description?: string;
  amount: number;
}
export interface DebtRowInput {
  label: string;
  amount: number;
  notes?: string;
}
export interface SavingsRowInput {
  label: string;
  target: number;
}

async function deleteTaggedBaseline(uid: mongoose.Types.ObjectId): Promise<void> {
  await Promise.all([
    Income.deleteMany({ user: uid, reason: new RegExp(`^${escapeRegex(BASELINE_INCOME_REASON_PREFIX)}`) }),
    Expense.deleteMany({ user: uid, reason: new RegExp(`^${escapeRegex(BASELINE_EXPENSE_REASON_PREFIX)}`) }),
    Debt.deleteMany({ user: uid, notes: new RegExp(`^${escapeRegex(BASELINE_DEBT_NOTES_PREFIX)}`) }),
  ]);
}

async function writeBaselineFinancials(
  uid: mongoose.Types.ObjectId,
  user: IUser,
  jobTitle: string,
  monthlyTakeHome: number,
  expenseRows: ExpenseRowInput[],
  debtRows: DebtRowInput[],
  savingsRows: SavingsRowInput[],
  opts: { replaceTagged: boolean; finishOnboarding: boolean }
): Promise<void> {
  const numAmt = (v: number) => Math.max(0, Math.round(v * 100) / 100);
  if (opts.replaceTagged) {
    await deleteTaggedBaseline(uid);
  }

  const currency = user.homeCurrency || 'CAD';
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const baseDate = new Date(y, m, 1, 12, 0, 0);

  await Income.create({
    user: uid,
    amount: numAmt(monthlyTakeHome),
    reason: baselineIncomeReason(jobTitle),
    date: baseDate,
  });

  let daySlot = 3;
  for (const row of expenseRows) {
    const catRaw = String(row.category || 'Other').trim();
    const cat = expenseCategories.includes(catRaw) ? catRaw : 'Other';
    const amount = numAmt(Number(row.amount) || 0);
    if (amount <= 0) continue;
    await Expense.create({
      user: uid,
      amount,
      category: cat,
      reason: baselineExpenseReason(cat, row.description || '', jobTitle),
      date: new Date(y, m, Math.min(daySlot, 28), 12, 0, 0),
    });
    daySlot += 2;
  }

  for (const d of debtRows) {
    const label = String(d.label || '').trim();
    const amount = numAmt(Number(d.amount) || 0);
    if (!label || amount <= 0) continue;
    await Debt.create({
      user: uid,
      label: label.slice(0, 120),
      amount,
      currency,
      direction: 'owed_by_me',
      notes: baselineDebtNotes(d.notes || ''),
    });
  }

  const goals = savingsRows
    .filter((s) => String(s.label || '').trim() && Number(s.target) > 0)
    .slice(0, 8)
    .map((s) => ({
      label: String(s.label).trim().slice(0, 80),
      target: numAmt(Number(s.target)),
    }));

  user.jobTitle = jobTitle.slice(0, 100);
  user.savingsGoals = goals;
  if (goals[0]) {
    user.savingsGoalLabel = goals[0].label;
    user.savingsGoalTarget = goals[0].target;
  } else {
    user.savingsGoalLabel = '';
    user.savingsGoalTarget = undefined;
  }
  if (opts.finishOnboarding) {
    user.onboardingComplete = true;
  }
  await user.save();
}

function parseExpenseRowsFromBody(body: Record<string, unknown>, num: (v: unknown) => number): ExpenseRowInput[] {
  const raw = body.expenseRows;
  if (Array.isArray(raw) && raw.length > 0) {
    const out: ExpenseRowInput[] = [];
    for (const item of raw) {
      const r = item as Record<string, unknown>;
      const amount = num(r.amount);
      if (amount <= 0) continue;
      out.push({
        category: String(r.category || 'Other'),
        description: String(r.description || ''),
        amount,
      });
    }
    return out;
  }
  const out: ExpenseRowInput[] = [];
  for (const { key, category } of ONBOARDING_EXPENSE_FIELDS) {
    const amount = num(body[key]);
    if (amount <= 0) continue;
    out.push({ category, description: `${category} (baseline)`, amount });
  }
  return out;
}

function parseDebtRowsFromBody(body: Record<string, unknown>, num: (v: unknown) => number): DebtRowInput[] {
  const raw = body.debtRows;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: DebtRowInput[] = [];
  for (const item of raw.slice(0, 40)) {
    const r = item as Record<string, unknown>;
    const label = String(r.label || r.name || '').trim();
    const amount = num(r.amount ?? r.balance);
    if (!label || amount <= 0) continue;
    out.push({ label, amount, notes: String(r.notes || '') });
  }
  return out;
}

function parseSavingsRowsFromBody(body: Record<string, unknown>, num: (v: unknown) => number): SavingsRowInput[] {
  const raw = body.savingsRows;
  if (Array.isArray(raw) && raw.length > 0) {
    const out: SavingsRowInput[] = [];
    for (const item of raw.slice(0, 8)) {
      const r = item as Record<string, unknown>;
      const label = String(r.label || '').trim();
      const target = num(r.target);
      if (!label || target <= 0) continue;
      out.push({ label, target });
    }
    return out;
  }
  const goals: SavingsRowInput[] = [];
  const rrsp = num(body.rrspTarget);
  const vac = num(body.vacationTarget);
  if (rrsp > 0) goals.push({ label: 'RRSP', target: rrsp });
  if (vac > 0) goals.push({ label: 'Vacation', target: vac });
  return goals;
}

export const completeOnboardingValidation = [
  body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
  body('monthlyTakeHome').isFloat({ gt: 0 }).withMessage('Enter your monthly take-home pay'),
];

export const updateBaselineValidation = completeOnboardingValidation;

export async function completeOnboarding(req: AuthRequest, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected.' });
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const uid = req.user!.id;
  const body = req.body as Record<string, unknown>;
  const jobTitle = String(body.jobTitle || '').trim();
  const monthlyTakeHome = Math.max(0, Number(body.monthlyTakeHome) || 0);

  const user = await User.findById(uid);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.onboardingComplete === true) {
    res.status(400).json({ message: 'Baseline already saved. Update income and expenses from the main pages or Settings.' });
    return;
  }

  const num = (v: unknown) => Math.max(0, Math.round((Number(v) || 0) * 100) / 100);
  const expenseRows = parseExpenseRowsFromBody(body, num);
  const debtRows = parseDebtRowsFromBody(body, num);
  const savingsRows = parseSavingsRowsFromBody(body, num);

  await writeBaselineFinancials(
    uid,
    user,
    jobTitle,
    monthlyTakeHome,
    expenseRows,
    debtRows,
    savingsRows,
    { replaceTagged: false, finishOnboarding: true }
  );

  const fresh = await User.findById(uid).select('-password');
  res.status(201).json({ user: serializeUser(fresh!) });
}

export async function updateBaseline(req: AuthRequest, res: Response): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected.' });
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const uid = req.user!.id;
  const body = req.body as Record<string, unknown>;
  const jobTitle = String(body.jobTitle || '').trim();
  const monthlyTakeHome = Math.max(0, Number(body.monthlyTakeHome) || 0);

  const user = await User.findById(uid);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (user.onboardingComplete !== true) {
    res.status(400).json({ message: 'Finish the initial baseline form first.' });
    return;
  }

  const num = (v: unknown) => Math.max(0, Math.round((Number(v) || 0) * 100) / 100);
  const expenseRows = parseExpenseRowsFromBody(body, num);
  const debtRows = parseDebtRowsFromBody(body, num);
  const savingsRows = parseSavingsRowsFromBody(body, num);

  await writeBaselineFinancials(
    uid,
    user,
    jobTitle,
    monthlyTakeHome,
    expenseRows,
    debtRows,
    savingsRows,
    { replaceTagged: true, finishOnboarding: false }
  );

  const fresh = await User.findById(uid).select('-password');
  res.json({ user: serializeUser(fresh!) });
}