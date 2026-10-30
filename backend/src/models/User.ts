import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'Super Admin' | 'Admin' | 'Campaign Creator' | 'Approver' | 'Viewer';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  departmentScope?: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Campaign Creator', 'Approver', 'Viewer'],
      default: 'Campaign Creator',
    },
    departmentScope: { type: String },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
