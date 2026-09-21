/**
 * Geolocation helpers for nearby-doctor ranking.
 * Pure functions — no DB access, so they can be unit tested standalone.
 */

// Reject null/''/undefined/whitespace explicitly: Number(null) and Number('')
// both coerce to 0, which would otherwise pass the range check.
const toFiniteNumber = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isValidLat = (v) => {
  const n = toFiniteNumber(v);
  return n !== null && n >= -90 && n <= 90;
};

const isValidLng = (v) => {
  const n = toFiniteNumber(v);
  return n !== null && n >= -180 && n <= 180;
};

/**
 * Great-circle distance between two coordinates in kilometres (Haversine).
 * Returns null when any coordinate is missing/invalid.
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  if (!isValidLat(lat1) || !isValidLat(lat2) || !isValidLng(lon1) || !isValidLng(lon2)) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Normalize a locality/address string for fuzzy matching:
 * lowercase, collapse whitespace, strip punctuation, drop noise words.
 */
const STOP_WORDS = new Set([
  'india', 'pincode', 'pin', 'state', 'near', 'block', 'zone', 'ward',
  'street', 'lane', 'road', 'area', 'district', 'town', 'village'
]);

// Generic locality suffixes. These alone must NOT count as a match, otherwise
// "Vaishali Nagar" would match "Malviya Nagar" just because both end in "nagar".
const GENERIC_SUFFIXES = new Set([
  'nagar', 'sector', 'phase', 'colony', 'extension', 'ext', 'market',
  'chowk', 'circle', 'enclave', 'park', 'heights', 'residency', 'square'
]);

const normalizeLocality = (str) => {
  if (!str) return [];
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
};

/** Tokens that actually identify a place (stop words AND generic suffixes removed). */
const distinctiveTokens = (tokens) => tokens.filter((t) => !GENERIC_SUFFIXES.has(t));

/**
 * Token-level locality match between the patient's locality and a doctor record.
 * Requires overlap on a *distinctive* token, so shared generic suffixes alone
 * do not create a match.
 */
const matchLocality = (patientLocality, doctor) => {
  const patientTokens = distinctiveTokens(normalizeLocality(patientLocality));
  if (!patientTokens.length) return false;

  const doctorTokens = new Set(
    distinctiveTokens([
      ...normalizeLocality(doctor?.locality),
      ...normalizeLocality(doctor?.address),
      ...normalizeLocality(doctor?.hospital)
    ])
  );
  if (!doctorTokens.size) return false;

  return patientTokens.some((t) => doctorTokens.has(t));
};

/**
 * Format a distance for display: <10 km shows one decimal, otherwise rounded.
 * Returns null for invalid input.
 */
const formatDistanceKm = (km) => {
  if (!Number.isFinite(km) || km < 0) return null;
  return km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
};

module.exports = {
  isValidLat,
  isValidLng,
  haversineKm,
  normalizeLocality,
  matchLocality,
  formatDistanceKm
};