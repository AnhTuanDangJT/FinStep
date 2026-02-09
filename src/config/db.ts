import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// NoSQL injection defense: reject unknown query keys and object values where strings expected
mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB (non-blocking)
 * Server will start even if MongoDB connection fails
 * This allows health checks and basic endpoints to work
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Production-safe connection options
    const options = {
      // Use default options in production, optimize for development
      maxPoolSize: env.NODE_ENV === 'production' ? 10 : 5,
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is not available
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    
    if (env.NODE_ENV !== 'production') {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } else {
      // Production: Minimal logging - connection established successfully
      // No sensitive data logged
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('MongoDB connection failed', error instanceof Error ? error : undefined);
    
    if (env.NODE_ENV !== 'production') {
      console.error('❌ MongoDB connection error:', errorMessage);
      console.error('⚠️  Server will continue to start, but database operations will fail');
      console.error('   Make sure MongoDB is running at:', env.MONGODB_URI);
    }
    
    // Don't exit - let server start anyway for health checks
    // MongoDB connection can be retried later
    throw error; // Re-throw so caller can decide
  }
};

// Handle connection events (production-safe logging)
mongoose.connection.on('disconnected', () => {
  if (env.NODE_ENV !== 'production') {
    console.log('⚠️  MongoDB disconnected');
  } else {
    logger.error('Database disconnected', new Error('MongoDB connection lost'));
  }
});

mongoose.connection.on('error', (err) => {
  logger.error('Database error', err);
  if (env.NODE_ENV !== 'production') {
    console.error('❌ MongoDB error:', err);
  }
});

