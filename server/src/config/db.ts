import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${config.mongoUri}`);
  } catch (err: any) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${config.mongoUri}: ${err.message}`);
    console.warn(`[Database Warning] Running in memory-buffered / offline resilient mode. For persistent production custody, start MongoDB container.`);
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
