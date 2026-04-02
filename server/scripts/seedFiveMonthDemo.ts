/**
 * Seed ~5 calendar months of income + expenses for one user (dashboard / ghost demos).
 *
 * Modes:
 *   surplus  — student-style income; expenses a bit under income (~+$250/mo) over 5 months
 *   tight    — student-style income; ~$205/mo short → total real balance about -$1,025.37 over 5 months
 *
 * Usage (from server/):
 *   npx tsx scripts/seedFiveMonthDemo.ts you@email.com surplus
 *   npx tsx scripts/seedFiveMonthDemo.ts you@email.com tight --reset
 *
 * Requires MONGODB_URI in .env (same as the API).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User.model.js';
import { Expense } from '../src/models/expense.model.js';
import Income from '../src/models/income.model.js';

type Mode = 'surplus' | 'tight';

const PLANS: Record<
  Mode,
  { incomeMonth: number; expenseLines: { day: number; category: string; amount: number; reason: string }[] }
> = {
  surplus: {
    /** ~$2,400/mo in, ~$2,150 out → +$250/mo (student-scale, no huge mortgage) */
    incomeMonth: 2400,
    expenseLines: [
      { day: 1, category: 'Rent', amount: 930, reason: 'Rent (room / shared)' },
      { day: 3, category: 'Utilities', amount: 85, reason: 'Power & internet' },
      { day: 5, category: 'Food', amount: 88, reason: 'Groceries' },
      { day: 8, category: 'Food', amount: 102, reason: 'Groceries' },
      { day: 10, category: 'Transport', amount: 72, reason: 'Transit pass' },
      { day: 12, category: 'Food', amount: 95, reason: 'Groceries' },
      { day: 14, category: 'Entertainment', amount: 48, reason: 'Streaming' },
      { day: 16, category: 'Food', amount: 92, reason: 'Dining out' },
      { day: 18, category: 'Transport', amount: 38, reason: 'Rides' },
      { day: 20, category: 'Healthcare', amount: 42, reason: 'Pharmacy' },
      { day: 22, category: 'Food', amount: 98, reason: 'Groceries' },
      { day: 24, category: 'Entertainment', amount: 62, reason: 'Night out' },
      { day: 26, category: 'Education', amount: 195, reason: 'Books / fees' },
      { day: 28, category: 'Other', amount: 112, reason: 'Misc' },
      { day: 29, category: 'Food', amount: 91, reason: 'Groceries' },
    ],
  },
  tight: {
    /**
     * ~$2,400/mo in, ~$2,605.074 out → -$205.074/mo → 5-month real balance = -$1,025.37
     * Rent is elevated vs roommates but not mortgage-level; still reads as “student tight.”
     */
    incomeMonth: 2400,
    expenseLines: [
      { day: 1, category: 'Rent', amount: 1050, reason: 'Rent (student housing)' },
      { day: 3, category: 'Utilities', amount: 95, reason: 'Power & internet' },
      { day: 5, category: 'Food', amount: 85, reason: 'Groceries' },
      { day: 8, category: 'Food', amount: 110, reason: 'Groceries' },
      { day: 10, category: 'Food', amount: 100, reason: 'Groceries' },
      { day: 12, category: 'Food', amount: 125, reason: 'Dining out' },
      { day: 14, category: 'Transport', amount: 65, reason: 'Transit' },
      { day: 16, category: 'Transport', amount: 45, reason: 'Rides' },
      { day: 18, category: 'Entertainment', amount: 45, reason: 'Streaming' },
      { day: 20, category: 'Entertainment', amount: 55, reason: 'Weekend' },
      { day: 22, category: 'Healthcare', amount: 55, reason: 'Copay' },
      { day: 24, category: 'Education', amount: 175, reason: 'Tuition / materials' },
      { day: 26, category: 'Education', amount: 100, reason: 'Software' },
      { day: 28, category: 'Other', amount: 500.074, reason: 'Misc & one-offs' },
    ],
  },
};

function monthStartsEndingToday(): Date[] {
  const now = new Date();
  const out: Date[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(d);
  }
  return out;
}

function sumExpenses(lines: typeof PLANS.surplus.expenseLines): number {
  return Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
}

async function main() {
  const argv = process.argv.slice(2).filter((a) => a !== '--reset');
  const reset = process.argv.includes('--reset');
  const email = argv[0];
  const mode = (argv[1] as Mode) || 'surplus';

  if (!email) {
    console.error('Usage: npx tsx scripts/seedFiveMonthDemo.ts <email> [surplus|tight] [--reset]');
    process.exit(1);
  }
  if (mode !== 'surplus' && mode !== 'tight') {
    console.error('Mode must be "surplus" or "tight"');
    process.exit(1);
  }

  const uri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/clearpath';
  await mongoose.connect(uri);

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }
  const uid = user._id;

  if (reset) {
    const [inc, exp] = await Promise.all([
      Income.deleteMany({ user: uid }),
      Expense.deleteMany({ user: uid }),
    ]);
    console.log(`Removed ${inc.deletedCount} income rows, ${exp.deletedCount} expense rows.`);
  }

  const plan = PLANS[mode];
  const expTotal = sumExpenses(plan.expenseLines);
  const netMonth = plan.incomeMonth - expTotal;
  console.log(
    `Mode "${mode}": ~$${plan.incomeMonth}/mo income, ~$${expTotal}/mo expenses → ~$${netMonth.toFixed(2)}/mo net (×5 months).`
  );

  const months = monthStartsEndingToday();
  let incomeCount = 0;
  let expenseCount = 0;

  for (const monthStart of months) {
    const y = monthStart.getFullYear();
    const m = monthStart.getMonth();

    const pay1 = new Date(y, m, 7, 12, 0, 0);
    const pay2 = new Date(y, m, 22, 12, 0, 0);
    const half = Math.round((plan.incomeMonth / 2) * 100) / 100;
    await Income.create([
      { user: uid, amount: half, reason: 'Paycheck', date: pay1 },
      { user: uid, amount: plan.incomeMonth - half, reason: 'Paycheck', date: pay2 },
    ]);
    incomeCount += 2;

    for (const line of plan.expenseLines) {
      const d = new Date(y, m, Math.min(line.day, 28), 12, 0, 0);
      await Expense.create({
        user: uid,
        amount: line.amount,
        category: line.category,
        reason: line.reason,
        date: d,
      });
      expenseCount += 1;
    }
  }

  console.log(`Inserted ${incomeCount} income and ${expenseCount} expense records for ${email}.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
