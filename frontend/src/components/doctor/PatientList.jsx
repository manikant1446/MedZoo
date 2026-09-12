import { useState, useEffect } from 'react';
import { 
  Search, Download, Plus, CheckCircle, UserPlus, User, Phone, 
  Mail, MapPin, Calendar, Clock, Edit3, X, Trash2, Pill, AlertCircle, Eye
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['Cardiology','Dermatology','Neurology','Orthopedics','Pediatrics','General','Oncology','Psychiatry','Other'];

export default function PatientList() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: '', patientPhone: '', patientEmail: '', diagnosis: '', category: 'General', status: 'treated', notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View / Edit Consultation Modal State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [editForm, setEditForm] = useState({
    diagnosis: '',
    category: 'General',
    status: 'pending',
    notes: '',
    prescriptions: []
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchConsultations(); }, []);

  const fetchConsultations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/consultations/doctor`);
      setConsultations(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createConsultation = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess(''); setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/consultations`, {
        patientName: form.patientName,
        patientPhone: form.patientPhone,
        patientEmail: form.patientEmail || undefined,
        diagnosis: form.diagnosis,
        category: form.category,
        status: form.status,
        notes: form.notes
      });
      const pName = res.data.patientId?.name || form.patientName || form.patientPhone;
      setFormSuccess(`Consultation for "${pName}" created successfully!`);
      setForm({ patientName: '', patientPhone: '', patientEmail: '', diagnosis: '', category: 'General', status: 'treated', notes: '' });
      fetchConsultations();
      setTimeout(() => { setShowForm(false); setFormSuccess(''); }, 2500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create consultation.');
    } finally { setSubmitting(false); }
  };

  // Open modal with consultation details and patient info
  const openEditModal = (c) => {
    setSelectedConsultation(c);
    setEditForm({
      diagnosis: c.diagnosis || '',
      category: c.category || 'General',
      status: c.status || 'pending',
      notes: c.notes || '',
      prescriptions: Array.isArray(c.prescriptions) && c.prescriptions.length > 0
        ? c.prescriptions.map(p => ({ medicine: p.medicine || '', dosage: p.dosage || '', duration: p.duration || '' }))
        : []
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleUpdateConsultation = async (e) => {
    e.preventDefault();
    if (!selectedConsultation) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const res = await axios.put(`${API_BASE_URL}/consultations/${selectedConsultation._id}`, {
        diagnosis: editForm.diagnosis,
        category: editForm.category,
        status: editForm.status,
        notes: editForm.notes,
        prescriptions: editForm.prescriptions
      });
      setEditSuccess('Consultation record updated successfully!');
      // Update local state immediately
      setConsultations(prev => prev.map(c => c._id === selectedConsultation._id ? res.data : c));
      setSelectedConsultation(res.data);
      setTimeout(() => { setEditSuccess(''); }, 2500);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update consultation.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConsultation = async () => {
    if (!selectedConsultation) return;
    if (!window.confirm('Are you sure you want to delete this consultation record?')) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/consultations/${selectedConsultation._id}`);
      setConsultations(prev => prev.filter(c => c._id !== selectedConsultation._id));
      setSelectedConsultation(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to delete consultation.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const addPrescriptionRow = () => {
    setEditForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medicine: '', dosage: '', duration: '' }]
    }));
  };

  const updatePrescriptionRow = (index, field, value) => {
    setEditForm(prev => {
      const next = [...prev.prescriptions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, prescriptions: next };
    });
  };

  const removePrescriptionRow = (index) => {
    setEditForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const generateReport = () => {
    const doc = new jsPDF();
    
    // Top colored banner
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 30, 'F');
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MedZoo', 14, 20);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Smart Healthcare Platform', 52, 19);
    
    // Doctor Details Section (Left Col)
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(`Doctor: Dr. ${user?.name || 'N/A'}`, 14, 42);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Specialty: ${user?.specialty || 'General Practice'}`, 14, 48);
    doc.text(`Hospital: ${user?.hospital || 'Private Practice'}`, 14, 54);
    doc.text(`Phone: ${user?.phone || 'N/A'}`, 14, 60);

    // Report Summary (Right Col)
    doc.setTextColor(31, 41, 55);
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 140, 42);
    doc.text(`Total Records: ${filtered.length}`, 140, 48);
    
    // Separator Line
    doc.setDrawColor(229, 231, 235);
    doc.line(14, 66, 196, 66);
    
    const tableData = filtered.map(c => ([
      c.patientId?.name || 'Unknown',
      c.category,
      c.diagnosis || '—',
      c.status.toUpperCase(),
      new Date(c.date).toLocaleDateString('en-IN')
    ]));
    
    autoTable(doc, {
      head: [['Patient', 'Category', 'Diagnosis', 'Status', 'Date']],
      body: tableData,
      startY: 72,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      bodyStyles: {
        textColor: [55, 65, 81],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        3: { fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.cell.section === 'body') {
          const val = data.cell.raw.toLowerCase();
          if (val === 'treated') {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (val === 'pending') {
            data.cell.styles.textColor = [245, 158, 11];
          } else if (val === 'referred') {
            data.cell.styles.textColor = [99, 102, 241];
          } else if (val === 'follow-up') {
            data.cell.styles.textColor = [34, 211, 238];
          }
        }
      },
      margin: { top: 72, bottom: 25, left: 14, right: 14 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('This record is cryptographically secure and stored on-chain on MedZoo Decentrailzed Network.', 14, 285);
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }

    doc.save('medzoo-report.pdf');
  };

  const filtered = consultations.filter(c => {
    const matchSearch = !search ||
      c.patientId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.patientPhone?.toLowerCase().includes(search.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page animate-in">
      <div className="page-header flex-between">
        <div>
          <h1>Patient Records</h1>
          <p>Manage consultations and generate reports</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={generateReport}>
            <Download size={16} /> Records
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}>
            <Plus size={16} /> New Consultation
          </button>
        </div>
      </div>

      {/* New Consultation Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserPlus size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Add Consultation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Enter any patient details — new patients are auto-registered
              </p>
            </div>
          </div>

          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', color: '#10b981',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', marginBottom: '1rem',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <CheckCircle size={16} /> {formSuccess}
            </div>
          )}

          <form onSubmit={createConsultation}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.25rem' }}>
              <div className="form-group">
                <label>Patient Name</label>
                <input className="form-input" placeholder="Full name..." value={form.patientName}
                  onChange={e => setForm({ ...form, patientName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Patient Phone *</label>
                <input className="form-input" placeholder="10-digit mobile..." required value={form.patientPhone}
                  onChange={e => setForm({ ...form, patientPhone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Patient Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" type="email" placeholder="patient@example.com" value={form.patientEmail}
                  onChange={e => setForm({ ...form, patientEmail: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '0.25rem' }}>
              <div className="form-group">
                <label>Diagnosis / Chief Complaint</label>
                <input className="form-input" placeholder="e.g., Hypertension, Type 2 Diabetes..." value={form.diagnosis}
                  onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="treated">Treated</option>
                  <option value="pending">Pending</option>
                  <option value="referred">Referred</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="form-textarea" placeholder="Additional notes about the consultation..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Consultation'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0, minWidth: 260 }}>
          <Search />
          <input placeholder="Search by patient name, phone, or diagnosis..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: '160px' }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="treated">Treated</option>
          <option value="pending">Pending</option>
          <option value="referred">Referred</option>
          <option value="follow-up">Follow-up</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>All Consultations</h3>
            <span className="badge badge-info">{filtered.length} records</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 Click any patient row to view full details & edit
          </span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Category</th>
                <th>Diagnosis / Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    {loading ? 'Loading consultations...' : 'No consultations found'}
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr 
                  key={c._id} 
                  onClick={() => openEditModal(c)} 
                  style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  title="Click to view full patient details and edit consultation"
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {c.patientId?.avatar ? (
                        <img 
                          src={c.patientId.avatar} 
                          alt={c.patientId.name} 
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                        />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--gradient-primary)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'white',
                          fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                        }}>
                          {c.patientId?.name?.charAt(0) || 'P'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {c.patientId?.name || 'Unknown Patient'}
                          {c.appointmentId && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              Appt
                            </span>
                          )}
                          {c.referralId && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              Referral
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📞 {c.patientPhone || c.patientId?.phone || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{c.category}</span></td>
                  <td>
                    <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {c.diagnosis || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      c.status === 'treated' ? 'badge-success' :
                      c.status === 'pending' ? 'badge-warning' :
                      c.status === 'follow-up' ? 'badge-info' : 'badge-primary'
                    }`}>{c.status}</span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={(e) => { e.stopPropagation(); openEditModal(c); }}
                    >
                      <Edit3 size={13} /> View / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Full Info & Consultation Edit Modal */}
      {selectedConsultation && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => !editLoading && setSelectedConsultation(null)}>
          <div className="card" style={{
            width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto',
            animation: 'fadeIn 0.25s ease-out', padding: '1.75rem', position: 'relative'
          }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {selectedConsultation.patientId?.avatar ? (
                  <img src={selectedConsultation.patientId.avatar} alt="Patient" style={{
                    width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)'
                  }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--gradient-primary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', fontWeight: 800, color: 'white',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                  }}>
                    {selectedConsultation.patientId?.name?.charAt(0) || 'P'}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                      {selectedConsultation.patientId?.name || 'Patient Details'}
                    </h2>
                    {selectedConsultation.referralId ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>🤝 From Referral</span>
                    ) : selectedConsultation.appointmentId ? (
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>📅 From Appointment</span>
                    ) : (
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>📋 Consultation</span>
                    )}
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Record ID #{selectedConsultation._id} • Date: {new Date(selectedConsultation.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConsultation(null)} 
                disabled={editLoading}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center'
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Notifications */}
            {editError && (
              <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} /> {editError}
              </div>
            )}
            {editSuccess && (
              <div style={{
                background: 'rgba(16,185,129,0.12)', color: '#10b981',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem', marginBottom: '1rem',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <CheckCircle size={16} /> {editSuccess}
              </div>
            )}

            {/* Patient Full Info Cards */}
            <div style={{
              background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border)'
            }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Patient Profile Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={15} color="var(--accent-primary)" />
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Phone</span>
                    {selectedConsultation.patientPhone ? (
                      <a href={`tel:${selectedConsultation.patientPhone}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {selectedConsultation.patientPhone}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={15} color="#38bdf8" />
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Email</span>
                    {selectedConsultation.patientId?.email ? (
                      <a href={`mailto:${selectedConsultation.patientId.email}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {selectedConsultation.patientId.email}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={15} color="#10b981" />
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Location</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {[selectedConsultation.patientId?.locality, selectedConsultation.patientId?.address].filter(Boolean).join(', ') || 'Jaipur / Local'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={15} color="#f59e0b" />
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Member Since</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {selectedConsultation.patientId?.createdAt 
                        ? new Date(selectedConsultation.patientId.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                        : 'Active Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Consultation Form */}
            <form onSubmit={handleUpdateConsultation}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Edit3 size={17} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Edit Consultation Details</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Diagnosis / Problem</label>
                  <input 
                    className="form-input" 
                    placeholder="Diagnosis..." 
                    value={editForm.diagnosis}
                    onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Category</label>
                  <select 
                    className="form-select" 
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Status</label>
                  <select 
                    className="form-select" 
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="treated">Treated</option>
                    <option value="pending">Pending</option>
                    <option value="referred">Referred</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Clinical Notes / Observation</label>
                <textarea 
                  className="form-textarea" 
                  style={{ minHeight: '75px' }}
                  placeholder="Doctor's clinical findings, advice, symptoms..."
                  value={editForm.notes} 
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })} 
                />
              </div>

              {/* Prescriptions Section */}
              <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Pill size={16} color="var(--accent-primary)" />
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>Prescriptions</label>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-ghost" 
                    onClick={addPrescriptionRow}
                    style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                {editForm.prescriptions.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', padding: '0.5rem' }}>
                    No prescriptions added yet. Click "+ Add Medicine" to prescribe drugs.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {editForm.prescriptions.map((p, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          className="form-input" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                          placeholder="Medicine name (e.g. Paracetamol 500mg)" 
                          value={p.medicine} 
                          onChange={e => updatePrescriptionRow(idx, 'medicine', e.target.value)} 
                        />
                        <input 
                          className="form-input" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                          placeholder="Dosage (e.g. 1-0-1 after food)" 
                          value={p.dosage} 
                          onChange={e => updatePrescriptionRow(idx, 'dosage', e.target.value)} 
                        />
                        <input 
                          className="form-input" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                          placeholder="Duration (e.g. 5 days)" 
                          value={p.duration} 
                          onChange={e => updatePrescriptionRow(idx, 'duration', e.target.value)} 
                        />
                        <button 
                          type="button" 
                          onClick={() => removePrescriptionRow(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.3rem' }}
                          title="Remove prescription"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  onClick={handleDeleteConsultation}
                  disabled={deleteLoading || editLoading}
                >
                  <Trash2 size={15} /> {deleteLoading ? 'Deleting...' : 'Delete Record'}
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setSelectedConsultation(null)}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={editLoading}
                    style={{ minWidth: 140, justifyContent: 'center' }}
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
