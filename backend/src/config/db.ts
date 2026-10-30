import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB() {
  try {
    await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Database] MongoDB connected successfully to MAPIMS cluster.');
  } catch (err: any) {
    console.warn(`[Database] MongoDB connection notice: ${err.message}. Running in memory fallback mode if required.`);
  }
}
