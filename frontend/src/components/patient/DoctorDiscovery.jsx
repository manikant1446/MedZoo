import { useState, useEffect } from 'react';
import { Search, Star, Users, ShieldCheck, Calendar, Clock, X, CheckCircle, ChevronLeft, MapPin } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function DoctorDiscovery() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [trustData, setTrustData] = useState({});
  const [loading, setLoading] = useState(true);

  // Booking state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(''); // '', 'booking', 'success', 'error'
  const [bookingError, setBookingError] = useState('');

  // My Appointments
  const [myAppointments, setMyAppointments] = useState([]);
  const [showAppointments, setShowAppointments] = useState(false);

  // Appointment Rating states
  const [ratingAppointment, setRatingAppointment] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const params = {};
        if (search) params.search = search;
        if (specialty) params.specialty = specialty;
        const res = await axios.get(`${API_BASE_URL}/doctors`, { params });
        setDoctors(res.data);

        const trustChecks = {};
        for (const doc of res.data) {
          try {
            const trustRes = await axios.get(`${API_BASE_URL}/contacts/trust-check/${doc._id}`);
            trustChecks[doc._id] = trustRes.data;
          } catch { trustChecks[doc._id] = { hasTrustedVisits: false, count: 0 }; }
        }
        setTrustData(trustChecks);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchDoctors();
  }, [search, specialty]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!bookingDoctor || !selectedDate) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/appointments/slots/${bookingDoctor._id}/${selectedDate}`);
        setSlots(res.data);
      } catch (err) { console.error(err); setSlots([]); }
      finally { setSlotsLoading(false); }
    };
    fetchSlots();
  }, [bookingDoctor, selectedDate]);

  const fetchMyAppointments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/appointments/patient`);
      setMyAppointments(res.data);
    } catch (err) { console.error(err); }
  };

  const openBooking = (doc) => {
    setBookingDoctor(doc);
    setSelectedDate('');
    setSelectedSlot('');
    setReason('');
    setSlots([]);
    setBookingStatus('');
    setBookingError('');
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;
    setBookingStatus('booking');
    setBookingError('');
    try {
      await axios.post(`${API_BASE_URL}/appointments`, {
        doctorId: bookingDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason
      });
      setBookingStatus('success');
      setTimeout(() => { setBookingDoctor(null); setBookingStatus(''); }, 2000);
    } catch (err) {
      setBookingStatus('error');
      setBookingError(err.response?.data?.message || 'Booking failed');
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/appointments/${id}/status`, { status: 'cancelled' });
      fetchMyAppointments();
    } catch (err) { console.error(err); }
  };

  const submitAptRating = async (e) => {
    e.preventDefault();
    if (!ratingAppointment) return;
    setSubmittingRating(true);
    setRatingError('');
    try {
      await axios.post(`${API_BASE_URL}/appointments/${ratingAppointment._id}/rate`, {
        rating: userRating
      });
      fetchMyAppointments();
      setRatingAppointment(null);
    } catch (err) {
      setRatingError(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const SPECIALTIES = ['', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General', 'Oncology', 'Psychiatry'];

  return (
    <div className="page animate-in">
      <div className="page-header flex-between">
        <div>
          <h1>Find Doctors</h1>
          <p>Trust-based discovery powered by your social network</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setShowAppointments(!showAppointments); if (!showAppointments) fetchMyAppointments(); }}>
          <Calendar size={16} /> {showAppointments ? 'Find Doctors' : 'My Appointments'}
        </button>
      </div>

      {/* My Appointments View */}
      {showAppointments ? (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>My Appointments</h2>
          {myAppointments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p>No appointments yet. Find a doctor and book one!</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {myAppointments.map(apt => (
                <div key={apt._id} className="card" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    {apt.doctorId?.avatar ? (
                      <img src={apt.doctorId.avatar} alt={apt.doctorId.name} style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        objectFit: 'cover', flexShrink: 0
                      }} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-secondary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                        fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
                      }}>
                        {apt.doctorId?.name?.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Dr. {apt.doctorId?.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {apt.doctorId?.specialty} • {apt.doctorId?.hospital}
                      </p>
                    </div>
                    <span className={`badge ${
                      apt.status === 'confirmed' ? 'badge-success' :
                      apt.status === 'completed' ? 'badge-success' :
                      apt.status === 'pending' ? 'badge-warning' :
                      apt.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                    }`}>{apt.status}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} /> {new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} /> {apt.timeSlot}
                    </span>
                  </div>

                  {apt.reason && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      Reason: {apt.reason}
                    </p>
                  )}

                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([apt.doctorId?.address, apt.doctorId?.locality, apt.doctorId?.hospital || 'Doctor Clinic'].filter(Boolean).join(', '))}`}
                         target="_blank" rel="noopener noreferrer"
                         className="btn btn-secondary btn-sm"
                         style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-secondary)', borderColor: 'rgba(34,211,238,0.2)' }}>
                        <MapPin size={14} /> Get Directions
                      </a>
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--accent-danger)' }}
                        onClick={() => cancelAppointment(apt._id)}>
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  )}

                  {apt.status === 'completed' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      {apt.rating > 0 ? (
                        <div style={{ display: 'flex', gap: '0.1rem', color: '#fbbf24', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.35rem' }}>Your rating:</span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} fill={i < apt.rating ? '#fbbf24' : 'none'} color="#fbbf24" strokeWidth={2} />
                          ))}
                        </div>
                      ) : (
                        <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => { setRatingAppointment(apt); setUserRating(5); setRatingError(''); }}>
                          Rate Doctor
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
              <Search />
              <input placeholder="Search doctors by name, specialty, or hospital..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: '200px' }}
              value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">All Specialties</option>
              {SPECIALTIES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Doctor Cards */}
          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No doctors found.</p>
          ) : (
            <div className="grid grid-3">
              {doctors.map((doc) => {
                const trust = trustData[doc._id];
                return (
                  <div key={doc._id} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.name} style={{
                          width: 48, height: 48, borderRadius: 'var(--radius-md)',
                          objectFit: 'cover', flexShrink: 0
                        }} />
                      ) : (
                        <div style={{
                          width: 48, height: 48, borderRadius: 'var(--radius-md)',
                          background: 'var(--gradient-primary)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.25rem', fontWeight: 800, color: 'white', flexShrink: 0
                        }}>
                          {doc.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Dr. {doc.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.specialty}</p>
                      </div>
                      {doc.isVerified && <ShieldCheck size={18} color="var(--accent-success)" style={{ marginLeft: 'auto' }} />}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      🏥 {doc.hospital || 'Independent Practice'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <span className="badge badge-info">
                        <Users size={12} /> {doc.patientCount} patients
                      </span>
                      <span className="badge badge-primary">
                        <Star size={12} /> {doc.qualifications || 'MBBS'}
                      </span>
                      <span className="badge badge-success">
                        ⭐ {doc.rating ? doc.rating.toFixed(1) : '5.0'} ({doc.ratingsCount || 0} reviews)
                      </span>
                      {doc.experience > 0 && (
                        <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          💼 {doc.experience} yrs exp
                        </span>
                      )}
                    </div>

                    {trust?.hasTrustedVisits && (
                      <div style={{
                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        fontSize: '0.8rem', color: '#10b981', marginBottom: '0.75rem'
                      }}>
                        ✅ {trust.count} of your contacts visited this doctor
                      </div>
                    )}

                    {/* Book Appointment Button */}
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => openBooking(doc)}>
                      <Calendar size={16} /> Book Appointment
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => bookingStatus !== 'booking' && setBookingDoctor(null)}>
          <div className="card" style={{
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
            animation: 'fadeIn 0.3s ease-out'
          }} onClick={e => e.stopPropagation()}>

            {bookingStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Appointment Booked!</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  Your appointment with Dr. {bookingDoctor.name} on {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at {selectedSlot} has been confirmed.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  {bookingDoctor.avatar ? (
                    <img src={bookingDoctor.avatar} alt={bookingDoctor.name} style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      objectFit: 'cover', flexShrink: 0
                    }} />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: 'var(--gradient-primary)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem', fontWeight: 800, color: 'white', flexShrink: 0
                    }}>
                      {bookingDoctor.name?.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Book Appointment</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Dr. {bookingDoctor.name} • {bookingDoctor.specialty}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>⭐ {bookingDoctor.rating ? bookingDoctor.rating.toFixed(1) : '5.0'} ({bookingDoctor.ratingsCount || 0} reviews)</span>
                      {bookingDoctor.experience > 0 && <span>• 💼 {bookingDoctor.experience} Yrs Exp</span>}
                    </p>
                  </div>
                  <button onClick={() => setBookingDoctor(null)} style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', padding: '0.25rem'
                  }}>
                    <X size={20} />
                  </button>
                </div>

                {bookingError && <div className="error-message">{bookingError}</div>}

                {/* Date Picker */}
                <div className="form-group">
                  <label>Select Date</label>
                  <input type="date" className="form-input" value={selectedDate}
                    min={getMinDate()} onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }} />
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="form-group">
                    <label>Select Time Slot</label>
                    {slotsLoading ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading available slots...</p>
                    ) : slots.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No slots available for this date.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                        {slots.map(slot => (
                          <button key={slot.time} type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.time)}
                            style={{
                              padding: '0.5rem 0.25rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem', fontWeight: 600,
                              cursor: slot.available ? 'pointer' : 'not-allowed',
                              border: selectedSlot === slot.time
                                ? '2px solid var(--accent-primary)'
                                : '1px solid var(--border)',
                              background: selectedSlot === slot.time
                                ? 'var(--accent-primary-glow)'
                                : !slot.available
                                  ? 'rgba(99,115,146,0.1)'
                                  : 'var(--bg-tertiary)',
                              color: !slot.available
                                ? 'var(--text-muted)'
                                : selectedSlot === slot.time
                                  ? 'var(--accent-primary)'
                                  : 'var(--text-secondary)',
                              opacity: slot.available ? 1 : 0.4,
                              textDecoration: slot.available ? 'none' : 'line-through',
                              fontFamily: 'inherit',
                              transition: 'all 0.15s ease'
                            }}>
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div className="form-group">
                  <label>Reason for Visit <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea className="form-textarea" placeholder="Describe your symptoms or reason..."
                    value={reason} onChange={e => setReason(e.target.value)}
                    style={{ minHeight: '60px' }} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                    disabled={!selectedSlot || bookingStatus === 'booking'}
                    onClick={confirmBooking}>
                    {bookingStatus === 'booking' ? 'Booking...' : `Confirm — ${selectedSlot || 'Select a slot'}`}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setBookingDoctor(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Appointment Rating Modal */}
      {ratingAppointment && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => !submittingRating && setRatingAppointment(null)}>
          <div className="card" style={{
            width: '100%', maxWidth: 400,
            animation: 'fadeIn 0.3s ease-out',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Rate Doctor</h3>
              <button onClick={() => setRatingAppointment(null)} disabled={submittingRating} style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}>
                <X size={20} />
              </button>
            </div>

            {ratingError && <div className="error-message">{ratingError}</div>}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              How was your consultation experience with <strong>Dr. {ratingAppointment.doctorId?.name}</strong>?
            </p>

            <form onSubmit={submitAptRating}>
              {/* Star Selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    disabled={submittingRating}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: submittingRating ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if(!submittingRating) e.currentTarget.style.transform = 'scale(1.25)'; }}
                    onMouseLeave={(e) => { if(!submittingRating) e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Star
                      size={32}
                      fill={star <= userRating ? '#fbbf24' : 'none'}
                      color="#fbbf24"
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submittingRating}>
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setRatingAppointment(null)} disabled={submittingRating}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
