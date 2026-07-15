const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const cleanUserIndexes = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
    if (collections.length > 0) {
      console.log('🔄 Clearing old indexes on users collection to sync schema alterations...');
      await mongoose.connection.db.collection('users').dropIndexes();
      console.log('✅ Indexes cleared successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Index cleanup warning (ignoring):', err.message);
  }
};

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medzoo';

    try {
      // Try connecting to the configured URI first
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await cleanUserIndexes();
      return;
    } catch (err) {
      if (process.env.VERCEL === '1') {
        console.error('❌ MongoDB Atlas connection failed on Vercel:', err.message);
        throw err;
      }
      
      // If we failed to connect to Atlas, try local MongoDB fallback before memory server
      if (uri !== 'mongodb://localhost:27017/medzoo') {
        try {
          console.log('Atlas connection failed. Trying local MongoDB fallback...');
          const conn = await mongoose.connect('mongodb://localhost:27017/medzoo', { serverSelectionTimeoutMS: 2000 });
          console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
          await cleanUserIndexes();
          return;
        } catch (localErr) {
          console.log('Local MongoDB fallback failed.');
        }
      }
      
      console.log('Local MongoDB not available, starting in-memory server...');
    }

    // Fallback to in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB In-Memory Server: ${conn.connection.host}`);
    console.log('⚠️  Data will NOT persist between restarts. Install MongoDB for persistence.');

    // Seed some demo data
    await seedDemoData();
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

async function seedDemoData() {
  const User = require('../models/User');
  const Consultation = require('../models/Consultation');

  // Create demo doctor 1
  const doctor = await User.create({
    email: 'doctor@medzoo.com',
    phone: '9000000001',
    password: 'password123',
    name: 'Sarah Johnson',
    role: 'doctor',
    specialty: 'Cardiology',
    hospital: 'City Heart Center',
    qualifications: 'MD, DM Cardiology',
    isVerified: true
  });

  // Create demo doctor 2
  const doctor2 = await User.create({
    email: 'neurologist@medzoo.com',
    phone: '9000000002',
    password: 'password123',
    name: 'Michael Chen',
    role: 'doctor',
    specialty: 'Neurology',
    hospital: 'Metro Brain Institute',
    qualifications: 'MD, DM Neurology',
    isVerified: true
  });

  // Create demo patient 1
  const patient1 = await User.create({
    email: 'patient@medzoo.com',
    phone: '9111111001',
    password: 'password123',
    name: 'Alex Thompson',
    role: 'patient',
  });

  // Create demo patient 2
  const patient2 = await User.create({
    phone: '9111111002',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'patient',
  });

  // Create demo patient 3
  const patient3 = await User.create({
    phone: '9111111003',
    password: 'password123',
    name: 'Rahul Verma',
    role: 'patient',
  });

  // Create demo consultations
  const patients = [patient1, patient2, patient3];
  const doctors = [doctor, doctor2];
  const categories = ['Cardiology', 'General', 'Neurology', 'Dermatology', 'Orthopedics'];
  const statuses = ['treated', 'treated', 'treated', 'pending', 'follow-up'];
  const diagnoses = [
    'Mild hypertension', 'Routine checkup', 'Tension headache',
    'Skin rash evaluation', 'Joint pain assessment'
  ];
  const phones = ['9111111001', '9111111002', '9111111003'];

  for (let i = 0; i < 35; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    await Consultation.create({
      patientId: patients[i % patients.length]._id,
      doctorId: doctors[i % doctors.length]._id,
      patientPhone: phones[i % phones.length],
      date,
      diagnosis: diagnoses[i % diagnoses.length],
      status: statuses[i % statuses.length],
      category: categories[i % categories.length],
      notes: `Consultation note #${i + 1}`,
      consultationHour: 8 + Math.floor(Math.random() * 10)
    });
  }

  console.log('✅ Demo data seeded:');
  console.log('   Doctors:  doctor@medzoo.com (📞 9000000001) | neurologist@medzoo.com (📞 9000000002)');
  console.log('   Patients: patient@medzoo.com (📞 9111111001) | 📞 9111111002 | 📞 9111111003');
  console.log('   Password: password123 (all accounts)');
  console.log('   Login: use phone number OR email');
}
module.exports = connectDB;