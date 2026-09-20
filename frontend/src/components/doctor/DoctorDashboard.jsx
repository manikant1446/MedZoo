import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, TrendingUp, Activity, FileCheck, RefreshCw, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

const COLORS = {
  purple: '#818cf8', cyan: '#22d3ee', green: '#10b981',
  amber: '#f59e0b', red: '#ef4444', pink: '#ec4899',
  teal: '#14b8a6', violet: '#8b5cf6', blue: '#3b82f6'
};
const CAT_COLORS = [COLORS.purple, COLORS.cyan, COLORS.green, COLORS.amber, COLORS.red, COLORS.violet, COLORS.pink, COLORS.teal, COLORS.blue];
const STATUS_COLORS = { treated: COLORS.green, pending: COLORS.amber, 'follow-up': COLORS.cyan, referred: COLORS.purple };

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/consultations/analytics`);
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAnalytics(), 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  // === Extract stats ===
  const statusMap = {};
  (analytics?.statusBreakdown || []).forEach(s => { statusMap[s._id] = s.count; });
  const treated = statusMap['treated'] || 0;
  const pending = statusMap['pending'] || 0;
  const referred = statusMap['referred'] || 0;
  const followUp = statusMap['follow-up'] || 0;
  const total = analytics?.totalConsultations || 0;
  const totalPatients = analytics?.totalPatients || 0;

  // Calculate success rate
  const successRate = total > 0 ? Math.round((treated / total) * 100) : 0;

  // === PATIENT TREND (Daily / Weekly toggle) ===
  const rawTrend = timeRange === 'daily' ? (analytics?.dailyCounts || []) : (analytics?.weeklyCounts || []);

  const trendLabels = rawTrend.map(d => {
    if (timeRange === 'daily') {
      const parts = d._id.split('-');
      return `${parts[2]}/${parts[1]}`;
    }
    return d._id; // Week format: 2026-W16
  });
  const trendValues = rawTrend.map(d => d.count);

  // Calculate trend direction
  const trendDirection = trendValues.length >= 2
    ? trendValues[trendValues.length - 1] - trendValues[trendValues.length - 2]
    : 0;

  const trendData = {
    labels: trendLabels,
    datasets: [{
      label: timeRange === 'daily' ? 'Daily Consultations' : 'Weekly Consultations',
      data: trendValues,
      borderColor: COLORS.purple,
      backgroundColor: (ctx) => {
        if (!ctx.chart.chartArea) return 'rgba(99,102,241,0.1)';
        const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.top, 0, ctx.chart.chartArea.bottom);
        gradient.addColorStop(0, 'rgba(99,102,241,0.3)');
        gradient.addColorStop(1, 'rgba(99,102,241,0.02)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: COLORS.purple,
      pointBorderColor: '#1a2235',
      pointBorderWidth: 2,
      borderWidth: 3,
    }]
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleColor: '#f0f4fc',
        bodyColor: '#8b9dc3',
        borderColor: 'rgba(99,115,146,0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        callbacks: {
          title: (items) => timeRange === 'daily' ? `Date: ${items[0].label}` : `Week: ${items[0].label}`,
          label: (item) => `Consultations: ${item.raw}`,
          afterLabel: (item) => {
            const pct = total > 0 ? ((item.raw / total) * 100).toFixed(1) : 0;
            return `${pct}% of total`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(99,115,146,0.08)' },
        ticks: { color: '#5a6d8e', font: { size: 10 }, maxRotation: 45 }
      },
      y: {
        grid: { color: 'rgba(99,115,146,0.08)' },
        ticks: {
          color: '#5a6d8e', font: { size: 11 },
          stepSize: 1, callback: (v) => Number.isInteger(v) ? v : ''
        },
        beginAtZero: true
      }
    }
  };

  // === DISEASE DISTRIBUTION (Doughnut) ===
  const categories = analytics?.categoryBreakdown || [];
  const catTotal = categories.reduce((s, c) => s + c.count, 0);

  const doughnutData = {
    labels: categories.map(c => c._id || 'Other'),
    datasets: [{
      data: categories.map(c => c.count),
      backgroundColor: CAT_COLORS.slice(0, categories.length),
      borderWidth: 2,
      borderColor: '#111827',
      hoverBorderColor: '#f0f4fc',
      hoverOffset: 6,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#8b9dc3', font: { size: 11, weight: '500' }, padding: 10, usePointStyle: true, pointStyleWidth: 10 }
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleColor: '#f0f4fc',
        bodyColor: '#8b9dc3',
        borderColor: 'rgba(99,115,146,0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (item) => {
            const pct = catTotal > 0 ? ((item.raw / catTotal) * 100).toFixed(1) : 0;
            return `${item.label}: ${item.raw} patients (${pct}%)`;
          }
        }
      }
    }
  };

  // === STATUS BREAKDOWN (Pie) ===
  const statusLabels = Object.keys(statusMap);
  const statusValues = Object.values(statusMap);
  const statusColors = statusLabels.map(s => STATUS_COLORS[s] || COLORS.blue);

  const statusData = {
    labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [{
      data: statusValues,
      backgroundColor: statusColors,
      borderWidth: 2,
      borderColor: '#111827',
      hoverOffset: 6,
    }]
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#8b9dc3', font: { size: 11, weight: '500' }, padding: 12, usePointStyle: true }
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleColor: '#f0f4fc',
        bodyColor: '#8b9dc3',
        borderColor: 'rgba(99,115,146,0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (item) => {
            const pct = total > 0 ? ((item.raw / total) * 100).toFixed(1) : 0;
            return `${item.label}: ${item.raw} (${pct}%)`;
          }
        }
      }
    }
  };

  // === PEAK HOURS (Bar) ===
  const hours = analytics?.hourlyBreakdown || [];
  const activeHours = hours.filter(h => h.count > 0).sort((a, b) => a._id - b._id);
  const startHour = activeHours.length > 0 ? Math.max(0, activeHours[0]._id - 1) : 6;
  const endHour = activeHours.length > 0 ? Math.min(23, activeHours[activeHours.length - 1]._id + 1) : 20;

  const hourLabels = [];
  const hourValues = [];
  const hourColors = [];
  const peakHour = activeHours.reduce((max, h) => h.count > max.count ? h : max, { count: 0 });

  for (let i = startHour; i <= endHour; i++) {
    hourLabels.push(`${i.toString().padStart(2, '0')}:00`);
    const found = hours.find(h => h._id === i);
    const val = found ? found.count : 0;
    hourValues.push(val);
    // Highlight peak hour
    hourColors.push(found && found._id === peakHour._id
      ? 'rgba(99,102,241,0.8)'
      : 'rgba(34,211,238,0.5)');
  }

  const barData = {
    labels: hourLabels,
    datasets: [{
      label: 'Consultations',
      data: hourValues,
      backgroundColor: hourColors,
      borderColor: hourColors.map(c => c.replace('0.5', '1').replace('0.8', '1')),
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleColor: '#f0f4fc',
        bodyColor: '#8b9dc3',
        borderColor: 'rgba(99,115,146,0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => `Time: ${items[0].label}`,
          label: (item) => `Consultations: ${item.raw}`,
          afterLabel: (item) => {
            if (item.raw === peakHour.count && item.raw > 0) return '⭐ Peak Hour';
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#5a6d8e', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(99,115,146,0.08)' },
        ticks: {
          color: '#5a6d8e', font: { size: 11 },
          stepSize: 1, callback: (v) => Number.isInteger(v) ? v : ''
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="page animate-in">
      <div className="page-header flex-between">
        <div>
          <h1>Doctor Analytics</h1>
          <p>Real-time performance overview for Dr. {user?.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchAnalytics(true)} disabled={refreshing}>
          <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={24} /></div>
          <div className="stat-info">
            <h4>Unique Patients</h4>
            <div className="stat-value">{totalPatients}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FileCheck size={24} /></div>
          <div className="stat-info">
            <h4>Treated</h4>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              {treated}
              <span style={{ fontSize: '0.8rem', color: COLORS.green }}>({successRate}%)</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Activity size={24} /></div>
          <div className="stat-info">
            <h4>Pending</h4>
            <div className="stat-value">{pending}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h4>Total Visits</h4>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              {total}
              {trendDirection !== 0 && (
                <span style={{ fontSize: '0.75rem', color: trendDirection > 0 ? COLORS.green : COLORS.red, display: 'flex', alignItems: 'center' }}>
                  {trendDirection > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(trendDirection)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Trend + Disease */}
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card chart-card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
              <h3>Patient Trend</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {timeRange === 'daily' ? 'Last 30 days' : 'Last 12 weeks'} • {trendValues.reduce((s, v) => s + v, 0)} consultations
              </p>
            </div>
            <div className="tabs">
              {['daily', 'weekly'].map(t => (
                <button key={t} className={`tab ${timeRange === t ? 'active' : ''}`}
                  onClick={() => setTimeRange(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="chart-wrapper">
            {trendValues.length > 0 ? (
              <Line data={trendData} options={trendOptions} />
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '5rem' }}>No data for this range</p>
            )}
          </div>
        </div>

        <div className="card chart-card">
          <div>
            <h3>Disease Distribution</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {categories.length} categories • Hover for exact %
            </p>
          </div>
          <div className="chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {categories.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Peak Hours + Status */}
      <div className="grid grid-2">
        <div className="card chart-card">
          <div>
            <h3>Peak Consultation Hours</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {peakHour.count > 0
                ? `⭐ Busiest: ${peakHour._id?.toString().padStart(2,'0')}:00 (${peakHour.count} consultations)`
                : 'No data yet'}
            </p>
          </div>
          <div className="chart-wrapper">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <div>
            <h3>Status Breakdown</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {total} total consultations • {statusLabels.length} statuses
            </p>
          </div>
          <div className="chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {statusLabels.length > 0 ? (
              <Pie data={statusData} options={statusOptions} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No data yet</p>
            )}
          </div>
          {/* Quick stats under chart */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {statusLabels.map((s, i) => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: statusColors[i] }}>
                  {statusValues[i]}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
