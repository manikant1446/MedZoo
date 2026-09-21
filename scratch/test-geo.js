/**
 * Standalone verification for backend/utils/geo.js (no DB needed).
 * Run: node scratch/test-geo.js
 */
const {
  isValidLat, isValidLng, haversineKm,
  normalizeLocality, matchLocality, formatDistanceKm
} = require('../backend/utils/geo');

let pass = 0, fail = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}  actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
};

// --- Known real-world distances ---
const jaipur = [26.9124, 75.7873], delhi = [28.6139, 77.2090], mumbai = [19.0760, 72.8777];
const jd = haversineKm(jaipur[0], jaipur[1], delhi[0], delhi[1]);
const jm = haversineKm(jaipur[0], jaipur[1], mumbai[0], mumbai[1]);
console.log(`Jaipur→Delhi  = ${jd.toFixed(1)} km (expect ~240)`);
console.log(`Jaipur→Mumbai = ${jm.toFixed(1)} km (expect ~930)`);
check('Jaipur→Delhi within tolerance', jd > 230 && jd < 250, true);
check('Jaipur→Mumbai within tolerance', jm > 900 && jm < 960, true);
check('same point = 0 km', haversineKm(26.9124, 75.7873, 26.9124, 75.7873), 0);
check('symmetric distance', haversineKm(...delhi, ...jaipur).toFixed(1), jd.toFixed(1));
check('1 degree lat ≈ 111 km', Math.round(haversineKm(0, 0, 1, 0)), 111);

// --- Validators ---
check('isValidLat(26.9) ', isValidLat('26.9'), true);
check('isValidLat(91) rejects', isValidLat(91), false);
check('isValidLat(-91) rejects', isValidLat(-91), false);
check('isValidLat(null) rejects', isValidLat(null), false);
check('isValidLat("abc") rejects', isValidLat('abc'), false);
check('isValidLat(undefined) rejects', isValidLat(undefined), false);
check('isValidLng(75.7) ', isValidLng('75.7'), true);
check('isValidLng(181) rejects', isValidLng(181), false);
check('isValidLng("") rejects', isValidLng(''), false);

// --- haversine returns null on bad input ---
check('haversine null on missing patient coords', haversineKm(null, null, 26.9, 75.7), null);
check('haversine null on bad doctor coords', haversineKm(26.9, 75.7, 999, 0), null);

// --- Locality normalization / matching ---
check('normalizeLocality strips punctuation+stopwords',
  normalizeLocality('Vaishali Nagar, Jaipur - India'), ['vaishali', 'nagar', 'jaipur']);
check('normalizeLocality("") -> []', normalizeLocality(''), []);
check('normalizeLocality(null) -> []', normalizeLocality(null), []);

check('exact locality match', matchLocality('Vaishali Nagar', { locality: 'Vaishali Nagar' }), true);
check('case-insensitive match', matchLocality('vaishali nagar', { locality: 'Vaishali Nagar' }), true);
check('match via address field', matchLocality('Mansarovar', { address: '12, Mansarovar Sector 5' }), true);
check('match via hospital field', matchLocality('jaipur', { hospital: 'City Heart Center Jaipur' }), true);
check('no match on different area', matchLocality('Vaishali Nagar', { locality: 'Malviya Nagar' }), false);
check('empty patient locality never matches', matchLocality('', { locality: 'Vaishali Nagar' }), false);
check('doctor with no location fields never matches', matchLocality('Jaipur', {}), false);

// --- Display formatting ---
check('formatDistanceKm(2.34) -> 2.3', formatDistanceKm(2.34), 2.3);
check('formatDistanceKm(23.6) -> 24', formatDistanceKm(23.6), 24);
check('formatDistanceKm(0.4) -> 0.4', formatDistanceKm(0.4), 0.4);
check('formatDistanceKm(null) -> null', formatDistanceKm(null), null);
check('formatDistanceKm(-5) -> null', formatDistanceKm(-5), null);

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
