import { useState, useEffect } from 'react';
import { Search, Download, Plus, CheckCircle, UserPlus } from 'lucide-react';
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

  const generateReport = () => {
    const doc = new jsPDF();
    
    // Top colored banner
    doc.setFillColor(79, 70, 229); // Indigo background
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
    doc.text('Decentralized Health Records Platform', 52, 19);
    
    // Doctor Details Section (Left Col)
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55); // Dark grey text
    doc.setFont('helvetica', 'bold');
    doc.text(`Doctor: Dr. ${user?.name || 'N/A'}`, 14, 42);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Specialty: ${user?.specialty || 'General Practice'}`, 14, 48);
    doc.text(`Hospital: ${user?.hospital || 'Private Practice'}`, 14, 54);
    
    const rawDid = user?.did || 'N/A';
    const cleanDid = rawDid.length > 50 ? `${rawDid.slice(0, 50)}...` : rawDid;
    doc.text(`DID: ${cleanDid}`, 14, 60);

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
        3: { fontStyle: 'bold' } // bold status column
      },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.cell.section === 'body') {
          const val = data.cell.raw.toLowerCase();
          if (val === 'treated') {
            data.cell.styles.textColor = [16, 185, 129]; // green
          } else if (val === 'pending') {
            data.cell.styles.textColor = [245, 158, 11]; // amber
          } else if (val === 'referred') {
            data.cell.styles.textColor = [99, 102, 241]; // indigo
          } else if (val === 'follow-up') {
            data.cell.styles.textColor = [34, 211, 238]; // cyan
          }
        }
      },
      margin: { top: 72, bottom: 25, left: 14, right: 14 }
    });

    // Page numbers and footer disclaimer on all pages
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
            {/* Patient Info Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.25rem' }}>
              <div className="form-group">
                <label>Patient Name</label>
                <input type="text" className="form-input" placeholder="e.g. Rahul Verma"
                  value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })}
                  required />
              </div>
              <div className="form-group">
                <label>📞 Phone Number <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span></label>
                <input type="tel" className="form-input" placeholder="e.g. 9876543210"
                  value={form.patientPhone} onChange={e => setForm({ ...form, patientPhone: e.target.value })}
                  required pattern="[0-9]{10,15}" title="Enter a valid phone number" />
              </div>
              <div className="form-group">
                <label>Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>(optional)</span></label>
                <input type="email" className="form-input" placeholder="e.g. rahul@example.com"
                  value={form.patientEmail} onChange={e => setForm({ ...form, patientEmail: e.target.value })} />
              </div>
            </div>

            {/* Medical Info Row */}
            <div className="grid grid-3" style={{ marginBottom: '0.25rem' }}>
              <div className="form-group">
                <label>Diagnosis</label>
                <input type="text" className="form-input" placeholder="e.g. Mild hypertension"
                  value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
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

            {/* Notes */}
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <Search />
          <input placeholder="Search patients or diagnoses..." value={search}
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
        <div className="card-header">
          <h3>All Consultations</h3>
          <span className="badge badge-info">{filtered.length} records</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Category</th><th>Diagnosis</th>
                <th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  {loading ? 'Loading...' : 'No consultations found'}
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {c.patientId?.name || 'Unknown'}
                  </td>
                  <td><span className="badge badge-info">{c.category}</span></td>
                  <td>{c.diagnosis || '—'}</td>
                  <td>
                    <span className={`badge ${
                      c.status === 'treated' ? 'badge-success' :
                      c.status === 'pending' ? 'badge-warning' :
                      c.status === 'follow-up' ? 'badge-info' : 'badge-primary'
                    }`}>{c.status}</span>
                  </td>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
