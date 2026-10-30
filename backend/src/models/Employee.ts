import mongoose, { Schema, Document } from 'mongoose';

export type ConsentStatus = 'Opted-In' | 'Opted-Out' | 'Pending Verification' | 'Unknown';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  category: string;
  department: string;
  designation: string;
  whatsappNumber: string;
  maskedNumber: string;
  consentStatus: ConsentStatus;
  consentSource?: string;
  consentDate?: Date;
  optOutDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    whatsappNumber: { type: String, required: true, trim: true },
    maskedNumber: { type: String, required: true },
    consentStatus: {
      type: String,
      enum: ['Opted-In', 'Opted-Out', 'Pending Verification', 'Unknown'],
      default: 'Opted-In',
    },
    consentSource: { type: String },
    consentDate: { type: Date },
    optOutDate: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmployeeModel = mongoose.model<IEmployee>('Employee', EmployeeSchema);
