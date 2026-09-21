/**
 * Verifies the tiered nearby-doctor ranking in backend/routes/doctors.js.
 * No DB needed — rankDoctors is a pure function.
 * Run: node scratch/test-nearby-ranking.js
 */
const { rankDoctors, formatDoctor } = require('../backend/routes/doctors');

let pass = 0, fail = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}  actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
};

// Patient is at Vaishali Nagar, Jaipur (26.9124, 75.7873)
const PATIENT = { lat: 26.9124, lng: 75.7873, locality: 'Vaishali Nagar' };

const mkDoctor = (id, over = {}) =>
  formatDoctor({ id, name: `Dr ${id}`, rating: 4.0, ratingsCount: 0, patientCount: 0, experience: 0, isVerified: 1, ...over });

// --- Tier ordering -----------------------------------------------------------
const doctors = [
  mkDoctor('far',   { latitude: null,   longitude: null,   locality: 'Somewhere Else' }),          // tier 2
  mkDoctor('top',   { latitude: 4.9,    longitude: 5.9,    locality: 'Nigeria' }),                 // tier 0 but very far
  mkDoctor('close', { latitude: 26.92,  longitude: 75.79,  locality: 'Other Place' }),             // tier 0, ~1.3 km
  mkDoctor('loc',   { latitude: null,   longitude: null,   locality: 'Vaishali Nagar, Jaipur' })   // tier 1
];

const ranked = rankDoctors(doctors, PATIENT);
check('order = closest GPS first', ranked.map(d => d.id), ['close', 'top', 'loc', 'far']);

// 0.886 km per Haversine, confirmed against an independent planar
// approximation (dLat 0.846 + dLon 0.268 -> 0.887 km). Rounds to 0.9.
check('closest doctor distance ~0.9km', ranked[0].distanceKm, 0.9);
check('far doctor has null distance', ranked.find(d => d.id === 'far').distanceKm, null);
check('GPS doctor is flagged nearby', ranked.find(d => d.id === 'close').isNearby, true);
check('locality-match doctor is flagged nearby', ranked.find(d => d.id === 'loc').isNearby, true);
check('unmatched doctor is NOT nearby', ranked.find(d => d.id === 'far').isNearby, false);
check('no doctor is dropped', ranked.length, 4);
check('internal rank field is stripped', ranked.some(d => 'rank' in d), false);
check('internal distanceRaw field is stripped', ranked.some(d => 'distanceRaw' in d), false);

// --- No patient coords → locality tier then rating ---------------------------
const noGps = rankDoctors(
  [
    mkDoctor('low',  { locality: 'Vaishali Nagar', rating: 3.0 }),
    mkDoctor('high', { locality: 'Vaishali Nagar', rating: 5.0 }),
    mkDoctor('none', { locality: 'Elsewhere',      rating: 5.0 })
  ],
  { lat: null, lng: null, locality: 'Vaishali Nagar' }
);
check('without coords, locality matches sort by rating', noGps.map(d => d.id), ['high', 'low', 'none']);
check('without coords, no distances computed', noGps.every(d => d.distanceKm === null), true);

// --- No coords AND no locality → legacy rating ordering ----------------------
const legacy = rankDoctors(
  [mkDoctor('a', { rating: 3.5 }), mkDoctor('b', { rating: 4.8 }), mkDoctor('c', { rating: 4.1 })],
  { lat: null, lng: null, locality: '' }
);
check('falls back to rating DESC (legacy behaviour)', legacy.map(d => d.id), ['b', 'c', 'a']);

// --- Invalid patient coords are ignored, not fatal ---------------------------
const badCoords = rankDoctors(
  [mkDoctor('x', { latitude: 26.9, longitude: 75.7 }), mkDoctor('y', { rating: 5.0 })],
  { lat: 'abc', lng: null, locality: '' }
);
check('invalid patient coords → no distances', badCoords.every(d => d.distanceKm === null), true);
check('invalid patient coords → still returns all', badCoords.length, 2);

// --- Doctor with coords but patient without → hasLocation true, distance null -
const partial = rankDoctors([mkDoctor('p', { latitude: 26.9, longitude: 75.7 })], { lat: null, lng: null, locality: '' });
check('doctor coords exposed even without patient coords', partial[0].hasLocation, true);
check('...but distance stays null', partial[0].distanceKm, null);
check('formatDoctor sets hasLocation false when coords null', formatDoctor({ id: 1, latitude: null, longitude: null }).hasLocation, false);

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
