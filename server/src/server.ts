import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectDB } from './config/db';
import { SocketService } from './services/socket.service';
import { User } from './models/User';

import bcrypt from 'bcrypt';

async function ensureDefaultAdmin() {
  const adminEmail = 'rbhrishikesh@gmail.com';
  const adminPass = 'Kesh@123';
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPass, salt);
    await User.updateOne(
      { email: adminEmail },
      {
        $set: {
          name: 'Hrishikesh Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isVerified: true,
          status: 'active',
          failedLoginAttempts: 0,
        },
      },
      { upsert: true }
    );
    console.log(`✅ [Admin Access] Synchronized Master Admin: ${adminEmail} (password: ${adminPass}) with full system permissions`);
  } catch (err) {
    console.error('❌ [Admin Access Setup Error]', err);
  }
}

async function bootstrap() {
  await connectDB();
  await ensureDefaultAdmin();

  const server = http.createServer(app);

  // Initialize real-time Socket.IO collaboration gateway with dynamic origin
  SocketService.init(server, '*');

  server.listen(config.port, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 [SecureDoc Advanced Server] Online & Secure`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Health Check: http://localhost:${config.port}/api/health`);
    console.log(`========================================================\n`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server Bootstrap Fatal Error]', err);
  process.exit(1);
});
