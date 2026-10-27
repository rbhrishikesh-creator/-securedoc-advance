import mongoose from 'mongoose';
import { User } from '../models/User';

async function updateKaviRole() {
  await mongoose.connect('mongodb://127.0.0.1:27017/securedoc_advanced');
  const res = await User.findOneAndUpdate(
    { email: 'akkaviarasu001@gmail.com' },
    { $set: { role: 'user' } },
    { new: true }
  );
  console.log('Result for akkaviarasu001@gmail.com:', res ? { email: res.email, role: res.role } : 'Not found');
  await mongoose.disconnect();
}

updateKaviRole();
