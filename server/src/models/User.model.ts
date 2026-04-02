import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavingsGoal {
  label: string;
  target?: number;
}

export interface IUser extends Document {
  email: string;
  password: string;
  displayName?: string;
  semesterStart?: Date;
  semesterEnd?: Date;
  homeCurrency: string;
  savingsGoalLabel?: string;
  savingsGoalTarget?: number;
  savingsGoals?: ISavingsGoal[];
  jobTitle?: string;
  /** false = must complete baseline onboarding; missing = legacy user (treated as done) */
  onboardingComplete?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    displayName: { type: String, trim: true, maxlength: 50, default: '' },
    semesterStart: { type: Date },
    semesterEnd: { type: Date },
    homeCurrency: { type: String, default: 'CAD', uppercase: true },
    savingsGoalLabel: { type: String, trim: true, maxlength: 100, default: '' },
    savingsGoalTarget: { type: Number, min: 0 },
    savingsGoals: [
      {
        label: { type: String, trim: true, maxlength: 80 },
        target: { type: Number, min: 0 },
      },
    ],
    jobTitle: { type: String, trim: true, maxlength: 100, default: '' },
    onboardingComplete: { type: Boolean },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);