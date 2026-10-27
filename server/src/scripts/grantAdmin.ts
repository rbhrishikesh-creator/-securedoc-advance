import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';

async function main() {
  await connectDB();

  const targetEmail = process.argv[2] || 'rbhrishikesh@gmail.com';
  console.log(`Checking user: ${targetEmail}...`);

  const users = await User.find({}, 'name email role isVerified status');
  console.log('All Users in Database:');
  console.table(users.map(u => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    status: u.status,
  })));

  const user = await User.findOne({ email: targetEmail.toLowerCase() });
  if (user) {
    user.role = 'admin';
    user.isVerified = true;
    user.status = 'active';
    await user.save();
    console.log(`\n✅ Successfully promoted ${user.email} (${user.name}) to ADMIN & VERIFIED!`);
  } else {
    console.log(`\n⚠️ User with email "${targetEmail}" does not exist yet.`);
    console.log(`To create or promote an admin, you can either register on http://localhost:5174 or run this script with credentials.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
