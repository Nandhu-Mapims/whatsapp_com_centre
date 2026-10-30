import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    displayOrder: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory>('Category', CategorySchema);

export interface IDepartment extends Document {
  code: string;
  name: string;
  categoryName: string;
  hodName?: string;
  active: boolean;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    categoryName: { type: String, required: true },
    hodName: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DepartmentModel = mongoose.model<IDepartment>('Department', DepartmentSchema);
