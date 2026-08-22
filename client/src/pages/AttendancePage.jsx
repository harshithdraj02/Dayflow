import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AttendancePage() {
  const { isAdmin } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [myData, setMyData] = useState(null);
  const [adminData, setAdminData] = useState([]);
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [typedDate, setTypedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(isAdmin ? 'admin' : 'employee');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [month, year, adminDate, activeView]);

  useEffect(() => {
    setTypedDate(adminDate);
  }, [adminDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeView === 'employee' || !isAdmin) {
        const data = await api.getMyAttendance(month, year);
        setMyData(data);
      }
      if (activeView === 'admin' && isAdmin) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(adminDate)) {
          const data = await api.getAllAttendance({ date: adminDate });
          setAdminData(data);
        }
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const prevDay = () => {
    const [y, m, d] = adminDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const nextStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    setAdminDate(nextStr);
  };

  const nextDay = () => {
    const [y, m, d] = adminDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    const nextStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    setAdminDate(nextStr);
  };

  const setToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setAdminDate(todayStr);
  };

  const handleDateTyped = (val) => {
    setTypedDate(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      if (!isNaN(dt.getTime())) {
        setAdminDate(val);
      }
    }
  };

  const handleDateBlurOrEnter = (e) => {
    if (e.key && e.key !== 'Enter') return;
    let parsed = typedDate.trim();
    // Support DD-MM-YYYY or DD/MM/YYYY
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(parsed)) {
      const parts = parsed.split(/[-/]/);
      const day = parts[0].padStart(2, '0');
      const mo = parts[1].padStart(2, '0');
      const yr = parts[2];
      parsed = `${yr}-${mo}-${day}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
      const [y, m, d] = parsed.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      if (!isNaN(dt.getTime())) {
        setAdminDate(parsed);
        setTypedDate(parsed);
        return;
      }
    }
    setTypedDate(adminDate);
  };

  const formatAdminDateLabel = (dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Selected Date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const map = { present: 'badge-present', absent: 'badge-absent', 'half-day': 'badge-half-day', leave: 'badge-leave' };
    return <span className={`badge ${map[status] || 'badge-absent'}`}>{status || 'absent'}</span>;
  };

  const filteredAdmin = adminData.filter(r =>
    `${r.first_name || ''} ${r.last_name || ''} ${r.department || ''}`.toLowerCase().includes((search || '').toLowerCase())
  );

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      {isAdmin && (
        <div className="tabs">
          <button className={`tab ${activeView === 'admin' ? 'active' : ''}`} onClick={() => setActiveView('admin')}>All Employees</button>
          <button className={`tab ${activeView === 'employee' ? 'active' : ''}`} onClick={() => setActiveView('employee')}>My Attendance</button>
        </div>
      )}

      {/* ADMIN VIEW */}
      {activeView === 'admin' && isAdmin && (
        <div>
          <div className="page-header">
            <h1>Attendance Records</h1>
            <div className="page-header-actions">
              <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="month-nav" style={{ flexWrap: 'wrap', gap: 10 }}>
            <button onClick={prevDay} title="Previous Day"><ChevronLeft size={18} /></button>
            <div className="month-label" style={{ minWidth: 220, textAlign: 'center' }}>
              {formatAdminDateLabel(adminDate)}
            </div>
            <button onClick={nextDay} title="Next Day"><ChevronRight size={18} /></button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={setToday}
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              Today
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input
                type="text"
                className="form-input"
                placeholder="YYYY-MM-DD"
                style={{ width: 130, padding: '7px 10px', fontSize: 13, textAlign: 'center' }}
                value={typedDate}
                onChange={e => handleDateTyped(e.target.value)}
                onBlur={handleDateBlurOrEnter}
                onKeyDown={handleDateBlurOrEnter}
                title="Type date as YYYY-MM-DD or DD-MM-YYYY and press Enter"
              />
              <input
                type="date"
                className="form-input"
                style={{ width: 44, padding: '7px 8px', cursor: 'pointer' }}
                value={adminDate}
                onChange={e => setAdminDate(e.target.value)}
                title="Choose from calendar"
              />
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Extra Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmin.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.first_name} {r.last_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.department}</td>
                    <td>{r.check_in || '—'}</td>
                    <td>{r.check_out || '—'}</td>
                    <td>{r.work_hours ? `${r.work_hours.toFixed(1)}h` : '—'}</td>
                    <td style={{ color: r.extra_hours > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {r.extra_hours ? `+${r.extra_hours.toFixed(1)}h` : '—'}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
                {filteredAdmin.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No attendance records for this date</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLOYEE VIEW */}
      {(activeView === 'employee' || !isAdmin) && myData && (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>My Attendance</h1>
          
          <div className="month-nav">
            <button onClick={prevMonth}><ChevronLeft size={18} /></button>
            <div className="month-label">{MONTHS[month - 1]} {year}</div>
            <button onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>

          <div className="attendance-stats">
            <div className="att-stat">
              <div className="att-value" style={{ color: 'var(--accent-green)' }}>{myData.stats.presentDays}</div>
              <div className="att-label">Present</div>
            </div>
            <div className="att-stat">
              <div className="att-value" style={{ color: 'var(--accent-blue)' }}>{myData.stats.leaveDays}</div>
              <div className="att-label">Leaves</div>
            </div>
            <div className="att-stat">
              <div className="att-value" style={{ color: 'var(--accent-yellow)' }}>{myData.stats.absentDays}</div>
              <div className="att-label">Absent</div>
            </div>
            <div className="att-stat">
              <div className="att-value">{myData.stats.totalWorkingDays}</div>
              <div className="att-label">Working Days</div>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Extra Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myData.records.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td>{r.check_in || '—'}</td>
                    <td>{r.check_out || '—'}</td>
                    <td>{r.work_hours ? `${r.work_hours.toFixed(1)}h` : '—'}</td>
                    <td style={{ color: r.extra_hours > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {r.extra_hours ? `+${r.extra_hours.toFixed(1)}h` : '—'}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
                {myData.records.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No records for this month</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
