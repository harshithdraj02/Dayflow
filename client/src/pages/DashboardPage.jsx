import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Search, 
  Plus, 
  Users, 
  UserCheck, 
  Plane, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Mail, 
  Phone,
  Briefcase,
  ChevronRight,
  X,
  CheckCircle2,
  Copy
} from 'lucide-react';

const DEPARTMENTS = ['All', 'Engineering', 'Design', 'Marketing', 'Human Resources', 'Finance', 'Operations'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const empData = await api.getEmployees();
      if (Array.isArray(empData)) {
        setEmployees(empData);
      } else {
        setEmployees([]);
      }
      if (isAdmin) {
        const ov = await api.getOverview();
        setOverview(ov);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const filtered = Array.isArray(employees)
    ? employees.filter(e => {
        if (!e) return false;
        const matchesSearch = `${e.first_name || ''} ${e.last_name || ''} ${e.department || ''} ${e.designation || ''} ${e.email || ''}`
          .toLowerCase()
          .includes((search || '').toLowerCase());
        const matchesDept = selectedDept === 'All' || e.department === selectedDept;
        return matchesSearch && matchesDept;
      })
    : [];

  const getStatusClass = (emp) => {
    if (!emp) return 'absent';
    if (emp.attendance_status === 'leave') return 'leave';
    if (emp.attendance_status === 'present' || emp.today_check_in) return 'present';
    return 'absent';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      {/* Hero Greeting Banner */}
      <div className="hero-banner">
        <div className="hero-greeting">
          <h1>{getGreeting()}, {user?.first_name || 'Team'}! 👋</h1>
          <p>
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              {isAdmin ? 'Organization Overview' : `${user?.designation || 'Team Member'} at ${user?.company_name || 'Dayflow'}`}
            </span>
          </p>
        </div>

        <div className="hero-quick-actions">
          {isAdmin && (
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => setShowNewModal(true)}
              id="add-employee-btn"
            >
              <Plus size={18} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin KPI Stat Cards */}
      {isAdmin && overview && (
        <div className="stat-cards-grid">
          <div 
            className="stat-card-glass" 
            style={{ 
              '--card-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              '--card-glow': 'rgba(99, 102, 241, 0.35)',
              '--icon-bg': 'rgba(99, 102, 241, 0.15)',
              '--icon-color': '#818cf8'
            }}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">Total Workforce</span>
              <span className="stat-card-value">{overview.totalEmployees}</span>
              <span className="stat-card-sub" style={{ color: 'var(--accent-green-light)' }}>
                Active in company
              </span>
            </div>
            <div className="stat-card-icon-box">
              <Users size={24} />
            </div>
          </div>

          <div 
            className="stat-card-glass" 
            style={{ 
              '--card-gradient': 'linear-gradient(135deg, #10b981, #059669)',
              '--card-glow': 'rgba(16, 185, 129, 0.35)',
              '--icon-bg': 'rgba(16, 185, 129, 0.15)',
              '--icon-color': '#34d399'
            }}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">Present Today</span>
              <span className="stat-card-value" style={{ color: 'var(--accent-green-light)' }}>
                {overview.presentToday}
              </span>
              <span className="stat-card-sub">
                {overview.totalEmployees > 0 
                  ? `${Math.round((overview.presentToday / overview.totalEmployees) * 100)}% attendance rate` 
                  : '0% rate'}
              </span>
            </div>
            <div className="stat-card-icon-box">
              <UserCheck size={24} />
            </div>
          </div>

          <div 
            className="stat-card-glass" 
            style={{ 
              '--card-gradient': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              '--card-glow': 'rgba(6, 182, 212, 0.35)',
              '--icon-bg': 'rgba(6, 182, 212, 0.15)',
              '--icon-color': '#38bdf8'
            }}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">On Leave Today</span>
              <span className="stat-card-value" style={{ color: '#38bdf8' }}>
                {overview.onLeaveToday}
              </span>
              <span className="stat-card-sub">Approved time off</span>
            </div>
            <div className="stat-card-icon-box">
              <Plane size={24} />
            </div>
          </div>

          <div 
            className="stat-card-glass" 
            style={{ 
              '--card-gradient': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              '--card-glow': 'rgba(245, 158, 11, 0.35)',
              '--icon-bg': 'rgba(245, 158, 11, 0.15)',
              '--icon-color': '#fbbf24'
            }}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">Pending Requests</span>
              <span className="stat-card-value" style={{ color: '#fbbf24' }}>
                {overview.pendingLeaves}
              </span>
              <span className="stat-card-sub">Awaiting HR review</span>
            </div>
            <div className="stat-card-icon-box">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Employee Shortcuts for Non-Admin */}
      {!isAdmin && (
        <div className="stat-cards-grid" style={{ marginBottom: 32 }}>
          <div 
            className="stat-card-glass" 
            style={{ cursor: 'pointer' }} 
            onClick={() => navigate(`/profile/${user?.id}`)}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">Profile & Skills</span>
              <span className="stat-card-value" style={{ fontSize: 24 }}>My Info</span>
              <span className="stat-card-sub">View personal & wage details</span>
            </div>
            <div className="stat-card-icon-box">
              <Users size={24} />
            </div>
          </div>

          <div 
            className="stat-card-glass" 
            style={{ cursor: 'pointer' }} 
            onClick={() => navigate('/attendance')}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">Monthly Clock</span>
              <span className="stat-card-value" style={{ fontSize: 24, color: 'var(--accent-green-light)' }}>Attendance</span>
              <span className="stat-card-sub">View logs & working hours</span>
            </div>
            <div className="stat-card-icon-box" style={{ '--icon-bg': 'rgba(16, 185, 129, 0.15)', '--icon-color': 'var(--accent-green-light)' }}>
              <Clock size={24} />
            </div>
          </div>

          <div 
            className="stat-card-glass" 
            style={{ cursor: 'pointer' }} 
            onClick={() => navigate('/time-off')}
          >
            <div className="stat-card-info">
              <span className="stat-card-label">Leave Balances</span>
              <span className="stat-card-value" style={{ fontSize: 24, color: 'var(--secondary-light)' }}>Time Off</span>
              <span className="stat-card-sub">Apply & track time off</span>
            </div>
            <div className="stat-card-icon-box" style={{ '--icon-bg': 'rgba(6, 182, 212, 0.15)', '--icon-color': 'var(--secondary-light)' }}>
              <Plane size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Directory Section Header & Search */}
      <div className="page-header">
        <div>
          <h1>Team Directory</h1>
          <p>{filtered.length} {filtered.length === 1 ? 'employee' : 'employees'} found</p>
        </div>

        <div className="page-header-actions">
          <div className="search-bar-modern">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, role, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-employees"
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

      {/* Department Filter Pills */}
      <div className="filter-tabs-pills">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            className={`filter-pill ${selectedDept === dept ? 'active' : ''}`}
            onClick={() => setSelectedDept(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Modern Employee Card Grid */}
      <div className="employee-grid-modern">
        {filtered.map((emp) => {
          const status = getStatusClass(emp);
          return (
            <div 
              key={emp.id} 
              className="emp-card-modern" 
              onClick={() => navigate(`/profile/${emp.id}`)}
            >
              <div className="emp-card-top">
                <div className="emp-avatar-wrapper">
                  <div className="emp-avatar">
                    {emp.profile_picture ? (
                      <img src={emp.profile_picture} alt={emp.first_name} />
                    ) : (
                      <span>{emp.first_name?.[0]}{emp.last_name?.[0]}</span>
                    )}
                  </div>
                  <span className={`emp-status-pulse ${status}`} title={`Status: ${status}`} />
                </div>

                <span className={`badge ${emp.role === 'admin' ? 'badge-admin' : 'badge-employee'}`}>
                  {emp.role}
                </span>
              </div>

              <div className="emp-card-name">{emp.first_name} {emp.last_name}</div>
              <div className="emp-card-role">{emp.designation || 'Staff Member'}</div>

              <div className="emp-card-badge-row">
                <span className="emp-dept-badge">{emp.department || 'General'}</span>
                <span className={`badge badge-${status}`}>
                  {status === 'leave' ? 'On Leave' : status === 'present' ? 'Present' : 'Absent'}
                </span>
              </div>

              <div className="emp-card-footer">
                <span style={{ fontFamily: 'monospace' }}>{emp.employee_id}</span>
                <span style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  View <ChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', marginTop: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No employees match your search</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>
            Try adjusting your search keywords or switching department filter tabs.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setSelectedDept('All'); }}>
            Reset Filters
          </button>
        </div>
      )}

      {/* New Employee Modal */}
      {showNewModal && (
        <NewEmployeeModal 
          onClose={() => setShowNewModal(false)} 
          onCreated={loadData} 
        />
      )}
    </div>
  );
}

function NewEmployeeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    first_name: '', 
    last_name: '', 
    email: '', 
    phone: '',
    department: 'Engineering', 
    designation: 'Software Engineer', 
    role: 'employee', 
    month_wage: '65000'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) { 
      setError('First name, last name, and email are required'); 
      return; 
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.signup({ ...form, month_wage: parseFloat(form.month_wage) || 50000 });
      setResult(data);
      onCreated();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const copyCredentials = () => {
    if (!result) return;
    const text = `Dayflow Login Credentials:\nEmail / ID: ${result.employee_id} (${form.email})\nPassword: ${result.generated_password}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{result ? 'Employee Account Created' : 'Onboard New Employee'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        {result ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius)', color: 'var(--accent-green-light)', fontWeight: 600, fontSize: 14, marginBottom: 20 }}>
              <CheckCircle2 size={20} />
              <span>Employee profile & payroll record generated!</span>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Employee ID</div>
              <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{result.employee_id}</div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Initial Password</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-yellow-light)' }}>{result.generated_password}</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                Share these credentials with the employee. They will be prompted to manage their profile upon first sign-in.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={copyCredentials}>
                <Copy size={16} />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius)', color: 'var(--accent-red-light)', fontSize: 13.5, marginBottom: 18 }}>
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input 
                  className="form-input" 
                  value={form.first_name} 
                  onChange={e => setForm({...form, first_name: e.target.value})} 
                  placeholder="e.g. Rahul" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input 
                  className="form-input" 
                  value={form.last_name} 
                  onChange={e => setForm({...form, last_name: e.target.value})} 
                  placeholder="e.g. Verma" 
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Work Email *</label>
                <input 
                  className="form-input" 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder="rahul.verma@company.com" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  className="form-input" 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  placeholder="+91 98765 43210" 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select 
                  className="form-select" 
                  value={form.department} 
                  onChange={e => setForm({...form, department: e.target.value})}
                >
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Human Resources</option>
                  <option>Finance</option>
                  <option>Operations</option>
                </select>
              </div>
              <div className="form-group">
                <label>System Role</label>
                <select 
                  className="form-select" 
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin / HR</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Job Designation</label>
                <input 
                  className="form-input" 
                  value={form.designation} 
                  onChange={e => setForm({...form, designation: e.target.value})} 
                  placeholder="e.g. Full Stack Developer" 
                />
              </div>
              <div className="form-group">
                <label>Monthly Gross Wage (₹)</label>
                <input 
                  className="form-input" 
                  type="number" 
                  value={form.month_wage} 
                  onChange={e => setForm({...form, month_wage: e.target.value})} 
                  placeholder="65000"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Profile...' : 'Complete Onboarding'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
