import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  status: 'active' | 'disabled';
  failedLoginAttempts: number;
  lastLoginAt?: Date;

  // 2-Step Verification (2FA) fields
  twoFactorEnabled: boolean;
  twoFactorMethod: 'totp' | 'email';
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    failedLoginAttempts: { type: Number, default: 0 },
    lastLoginAt: { type: Date },

    // 2-Step Verification Configuration
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['totp', 'email'], default: 'totp' },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: [{ type: String, select: false }],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
