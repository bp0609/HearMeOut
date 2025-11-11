// Server Entry Point

import app from './app';
import { prisma } from './services/prisma';

const PORT = Number(process.env.PORT) || 5001;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    // Start server - listen on all network interfaces (0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Network access: http://10.7.14.58:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ ML Service URL: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
