// API & Contract Config
export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
  : '/api';

export const CONTRACT_ADDRESSES = {
  MedicalRecords: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  DoctorRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ReviewSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  ReferralSystem: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
};
