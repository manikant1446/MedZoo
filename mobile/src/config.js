import { Platform } from 'react-native';

// Machine LAN IP — your laptop's IP address when connected to your phone's hotspot or Wi-Fi
const LOCAL_DEV_IP = '10.60.216.250';

const getBaseUrl = () => {
  // If running in physical phone (Expo Go via Hotspot/Wi-Fi) or iOS simulator
  // Both Android physical phones and iOS phones reach the laptop via its LAN IP
  return `http://${LOCAL_DEV_IP}:5001/api`;
};

export const API_BASE_URL = getBaseUrl();
