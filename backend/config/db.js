const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/medzoo';

    try {
      // Try connecting to the configured URI first
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
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
  const { ethers } = require('ethers');

  // Create demo doctor
  const doctorWallet = ethers.Wallet.createRandom();
  const doctor = await User.create({
    email: 'doctor@medzoo.com',
    password: 'password123',
    name: 'Sarah Johnson',
    role: 'doctor',
    specialty: 'Cardiology',
    hospital: 'City Heart Center',
    qualifications: 'MD, DM Cardiology',
    walletAddress: doctorWallet.address.toLowerCase(),
    walletPrivateKey: doctorWallet.privateKey,
    did: `did:ethr:${doctorWallet.address}`,
    isVerified: true
  });

  // Create demo doctor 2
  const doc2Wallet = ethers.Wallet.createRandom();
  const doctor2 = await User.create({
    email: 'neurologist@medzoo.com',
    password: 'password123',
    name: 'Michael Chen',
    role: 'doctor',
    specialty: 'Neurology',
    hospital: 'Metro Brain Institute',
    qualifications: 'MD, DM Neurology',
    walletAddress: doc2Wallet.address.toLowerCase(),
    walletPrivateKey: doc2Wallet.privateKey,
    did: `did:ethr:${doc2Wallet.address}`,
    isVerified: true
  });

  // Create demo patient 1
  const p1Wallet = ethers.Wallet.createRandom();
  const patient1 = await User.create({
    email: 'patient@medzoo.com',
    password: 'password123',
    name: 'Alex Thompson',
    role: 'patient',
    walletAddress: p1Wallet.address.toLowerCase(),
    walletPrivateKey: p1Wallet.privateKey,
    did: `did:ethr:${p1Wallet.address}`
  });

  // Create demo patient 2
  const p2Wallet = ethers.Wallet.createRandom();
  const patient2 = await User.create({
    email: 'priya@medzoo.com',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'patient',
    walletAddress: p2Wallet.address.toLowerCase(),
    walletPrivateKey: p2Wallet.privateKey,
    did: `did:ethr:${p2Wallet.address}`
  });

  // Create demo patient 3
  const p3Wallet = ethers.Wallet.createRandom();
  const patient3 = await User.create({
    email: 'rahul@medzoo.com',
    password: 'password123',
    name: 'Rahul Verma',
    role: 'patient',
    walletAddress: p3Wallet.address.toLowerCase(),
    walletPrivateKey: p3Wallet.privateKey,
    did: `did:ethr:${p3Wallet.address}`
  });

  // Create demo consultations across various dates, categories, and patients
  const patients = [patient1, patient2, patient3];
  const doctors = [doctor, doctor2];
  const categories = ['Cardiology', 'General', 'Neurology', 'Dermatology', 'Orthopedics'];
  const statuses = ['treated', 'treated', 'treated', 'pending', 'follow-up'];
  const diagnoses = [
    'Mild hypertension', 'Routine checkup', 'Tension headache',
    'Skin rash evaluation', 'Joint pain assessment'
  ];

  for (let i = 0; i < 35; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    await Consultation.create({
      patientId: patients[i % patients.length]._id,
      doctorId: doctors[i % doctors.length]._id,
      date,
      diagnosis: diagnoses[i % diagnoses.length],
      status: statuses[i % statuses.length],
      category: categories[i % categories.length],
      notes: `Consultation note #${i + 1}`,
      consultationHour: 8 + Math.floor(Math.random() * 10)
    });
  }

  console.log('✅ Demo data seeded:');
  console.log('   Doctors:  doctor@medzoo.com | neurologist@medzoo.com');
  console.log('   Patients: patient@medzoo.com | priya@medzoo.com | rahul@medzoo.com');
  console.log('   Password: password123 (all accounts)');
}
module.exports = connectDB;