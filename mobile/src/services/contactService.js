import * as Contacts from 'expo-contacts';
import api from './api';

/**
 * Request device contact permission and sync with MedZoo backend
 */
export const syncDeviceContacts = async () => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    
    let contactList = [];
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Name],
      });

      if (data && data.length > 0) {
        contactList = data.map(c => ({
          name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          phoneNumbers: c.phoneNumbers ? c.phoneNumbers.map(p => p.number) : [],
          emails: c.emails ? c.emails.map(e => e.email) : []
        }));
      }
    }

    // No contacts accessible (permission denied or no contacts)
    // Return empty list — no mock data used in production

    // Send to backend for matching
    const res = await api.post('/contacts/sync', { contacts: contactList });
    return {
      success: true,
      permissionStatus: status,
      contactsCount: res.data.contactsCount,
      matches: res.data.matches
    };
  } catch (error) {
    console.error('Failed to sync device contacts:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Fetch doctors recommended by the Smart Recommendation Algorithm
 * (Doctors who have treated people in the user's phone contacts)
 */
export const getRecommendedDoctors = async () => {
  try {
    const res = await api.get('/contacts/recommended-doctors');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch recommended doctors:', error);
    return {
      hasContactsSynced: false,
      totalContactsCount: 0,
      recommendations: []
    };
  }
};
