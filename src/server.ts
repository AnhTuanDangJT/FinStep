import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import mongoose from 'mongoose';

// Resolve PORT - default to 4000 for frontend compatibility
const PORT = env.PORT || 4000;

// ============================================
// Global Error Handlers (must be first)
// ============================================
process.on('uncaughtException', (error: Error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION - Server will shut down');
  console.error('Error:', error.message);
  if (env.NODE_ENV !== 'production') {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('\n❌ UNHANDLED REJECTION');
  if (reason instanceof Error) {
    console.error('Error:', reason.message);
    if (env.NODE_ENV !== 'production') {
      console.error('Stack:', reason.stack);
    }
  } else {
    console.error('Reason:', reason);
  }
  // Don't exit on unhandled rejection - log and continue
  // This prevents silent failures
});

// ============================================
// MongoDB Connection (Non-blocking)
// ============================================
// Try to connect, but don't block server startup if it fails
connectDB()
  .then(() => {
    if (env.NODE_ENV !== 'production') {
      console.log('✅ MongoDB connection successful');
    }
    startServer();
  })
  .catch(() => {
    // MongoDB connection failed, but we'll still start the server
    // This allows health checks and other basic endpoints to work
    console.warn('⚠️  Starting server without MongoDB connection');
    console.warn('   Some endpoints may not work until MongoDB is available');
    startServer();
  });

// ============================================
// Server Startup
// ============================================
function startServer(): void {
  try {
    // Start server - this should always execute
    const server = app.listen(PORT, '0.0.0.0', () => {
      // Server is now listening
      console.log('\n🚀 ========================================');
      console.log('✅ Server started successfully!');
      console.log('🚀 ========================================');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 Auth API: http://localhost:${PORT}/auth`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
      console.log('🚀 ========================================\n');

      // Verify health endpoint is accessible
      if (env.NODE_ENV !== 'production') {
        console.log('💡 Tip: Test the health endpoint:');
        console.log(`   curl http://localhost:${PORT}/health`);
        console.log(`   or open in browser: http://localhost:${PORT}/health\n`);
      }
    });

    // Handle server errors (port already in use, etc.)
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error('   Solutions:');
        console.error(`   1. Change PORT in .env file to a different port`);
        console.error(`   2. Stop the process using port ${PORT}`);
        console.error(`   3. Find the process: netstat -ano | findstr :${PORT}`);
      } else {
        console.error('\n❌ Server error:', error.message);
        if (env.NODE_ENV !== 'production') {
          console.error('Stack:', error.stack);
        }
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error instanceof Error ? error.message : 'Unknown error');
    if (env.NODE_ENV !== 'production' && error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// ============================================
// Graceful Shutdown Handlers
// ============================================
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server gracefully');
  mongoose.connection.close().then(() => {
    console.log('✅ Database connection closed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error closing database:', error);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received (Ctrl+C): closing HTTP server gracefully');
  mongoose.connection.close().then(() => {
    console.log('✅ Database connection closed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error closing database:', error);
    process.exit(1);
  });
});
