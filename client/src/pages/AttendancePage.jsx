import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  CalendarDays, 
  AlertCircle, 
  Calendar,
  Zap,
  TrendingUp,
  UserCheck,
  UserX,
  X
} from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AttendancePage() {
  const { isAdmin, user } = useAuth();
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
    if (activeView === 'admin' && isAdmin) {
      if (!adminDate || isNaN(new Date(adminDate).getTime())) {
        // Safe check: clear employee list and short-circuit to avoid backend 500 or React crash
        setAdminData([]);
        return;
      }
    }

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
    const d = new Date(adminDate);
    if (isNaN(d.getTime())) {
      setAdminDate(new Date().toISOString().split('T')[0]);
      return;
    }
    d.setDate(d.getDate() - 1);
    try {
      setAdminDate(d.toISOString().split('T')[0]);
    } catch (e) {
      setAdminDate(new Date().toISOString().split('T')[0]);
    }
  };

  const nextDay = () => {
    const d = new Date(adminDate);
    if (isNaN(d.getTime())) {
      setAdminDate(new Date().toISOString().split('T')[0]);
      return;
    }
    d.setDate(d.getDate() + 1);
    try {
      setAdminDate(d.toISOString().split('T')[0]);
    } catch (e) {
      setAdminDate(new Date().toISOString().split('T')[0]);
    }
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
      {/* View Switcher Tabs for Admin */}
      {isAdmin && (
        <div className="tabs">
          <button 
            className={`tab ${activeView === 'admin' ? 'active' : ''}`} 
            onClick={() => setActiveView('admin')}
          >
            All Employees Attendance
          </button>
          <button 
            className={`tab ${activeView === 'employee' ? 'active' : ''}`} 
            onClick={() => setActiveView('employee')}
          >
            My Personal Clock
          </button>
        </div>
      )}

      {/* ADMIN ALL-EMPLOYEES VIEW */}
      {activeView === 'admin' && isAdmin && (
        <div>
          <div className="page-header">
            <div>
              <h1>Workforce Attendance</h1>
              <p>Daily timecard logs and shift hours across all company departments</p>
            </div>

            <div className="page-header-actions">
              <div className="search-bar-modern">
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Filter by employee name..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="month-nav" style={{ flexWrap: 'wrap', gap: 12 }}>
            <button onClick={prevDay} title="Previous Day"><ChevronLeft size={18} /></button>
            <div className="month-label">
              {adminDate && !isNaN(new Date(adminDate).getTime()) ? (
                new Date(adminDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              ) : (
                'Select a valid date...'
              )}
            </div>
            <button onClick={nextDay} title="Next Day"><ChevronRight size={18} /></button>
            <input
              type="date"
              className="form-input"
              style={{ width: 170, padding: '8px 12px' }}
              value={adminDate}
              onChange={e => setAdminDate(e.target.value)}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setAdminDate(new Date().toISOString().split('T')[0])}
            >
              Today
            </button>
          </div>

          {/* Records Table */}
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
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </div>
                        <div>
                          <div>{r.first_name} {r.last_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.department}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.check_in ? (
                        <span style={{ color: 'var(--accent-green-light)' }}>{r.check_in}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.check_out ? (
                        <span style={{ color: 'var(--secondary-light)' }}>{r.check_out}</span>
                      ) : '—'}
                    </td>
                    <td>
                      {r.work_hours ? (
                        <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontWeight: 600 }}>
                          {r.work_hours.toFixed(1)}h
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {r.extra_hours > 0 ? (
                        <span style={{ color: 'var(--accent-green-light)', fontWeight: 700 }}>
                          +{r.extra_hours.toFixed(1)}h
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0h</span>
                      )}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
                {filteredAdmin.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      <Calendar size={28} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto' }} />
                      No attendance punch records found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLOYEE PERSONAL ATTENDANCE VIEW */}
      {(activeView === 'employee' || !isAdmin) && myData && (
        <div>
          <div className="page-header">
            <div>
              <h1>My Attendance Records</h1>
              <p>Monthly overview of your work shifts, check-in logs, and overtime</p>
            </div>

            <div className="month-nav" style={{ marginBottom: 0 }}>
              <button onClick={prevMonth}><ChevronLeft size={18} /></button>
              <div className="month-label" style={{ minWidth: 160, textAlign: 'center' }}>
                {MONTHS[month - 1]} {year}
              </div>
              <button onClick={nextMonth}><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* Monthly KPI Stats Cards */}
          <div className="attendance-stats">
            <div className="att-stat" style={{ borderTop: '3px solid var(--accent-green)' }}>
              <div className="att-value" style={{ color: 'var(--accent-green-light)' }}>
                {myData.stats.presentDays}
              </div>
              <div className="att-label">Days Present</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                {myData.stats.totalWorkingDays > 0 
                  ? `${Math.round((myData.stats.presentDays / myData.stats.totalWorkingDays) * 100)}% attendance`
                  : '0% attendance'}
              </div>
            </div>

            <div className="att-stat" style={{ borderTop: '3px solid var(--secondary)' }}>
              <div className="att-value" style={{ color: 'var(--secondary-light)' }}>
                {myData.stats.leaveDays}
              </div>
              <div className="att-label">Leave Days</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Approved time off</div>
            </div>

            <div className="att-stat" style={{ borderTop: '3px solid var(--accent-yellow)' }}>
              <div className="att-value" style={{ color: 'var(--accent-yellow-light)' }}>
                {myData.stats.absentDays}
              </div>
              <div className="att-label">Unrecorded / Absent</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Missed shifts</div>
            </div>

            <div className="att-stat" style={{ borderTop: '3px solid var(--primary)' }}>
              <div className="att-value" style={{ color: 'var(--primary-light)' }}>
                {myData.stats.totalWorkingDays}
              </div>
              <div className="att-label">Total Working Days</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Excluding weekends</div>
            </div>
          </div>

          {/* Records Table */}
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
                    <td style={{ fontWeight: 600 }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {r.check_in ? (
                        <span style={{ color: 'var(--accent-green-light)', fontWeight: 600 }}>{r.check_in}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {r.check_out ? (
                        <span style={{ color: 'var(--secondary-light)', fontWeight: 600 }}>{r.check_out}</span>
                      ) : '—'}
                    </td>
                    <td>
                      {r.work_hours ? (
                        <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontWeight: 600 }}>
                          {r.work_hours.toFixed(1)}h
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {r.extra_hours > 0 ? (
                        <span style={{ color: 'var(--accent-green-light)', fontWeight: 700 }}>
                          +{r.extra_hours.toFixed(1)}h
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0h</span>
                      )}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
                {myData.records.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      No attendance punch records found for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
