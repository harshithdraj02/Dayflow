import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Search, Plus, Users, UserCheck, UserX, Plane, Clock, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
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

  const filtered = Array.isArray(employees)
    ? employees.filter(e =>
        e && `${e.first_name || ''} ${e.last_name || ''} ${e.department || ''} ${e.designation || ''}`
          .toLowerCase()
          .includes((search || '').toLowerCase())
      )
    : [];

  const getStatusClass = (emp) => {
    if (!emp) return 'absent';
    if (emp.attendance_status === 'leave') return 'leave';
    if (emp.attendance_status === 'present' || emp.today_check_in) return 'present';
    return 'absent';
  };

  const getStatusIcon = (emp) => {
    if (!emp) return null;
    const status = getStatusClass(emp);
    if (status === 'leave') return '✈️';
    if (status === 'present') return null;
    return null;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      {isAdmin && overview && (
        <div className="stat-cards">
          <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
            <div className="stat-icon"><Users size={20} /></div>
            <div className="stat-value">{overview.totalEmployees}</div>
            <div className="stat-label">Total Employees</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent-green)' }}>
            <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-green)' }}><UserCheck size={20} /></div>
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{overview.presentToday}</div>
            <div className="stat-label">Present Today</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)' }}>
            <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.1)', color: 'var(--accent-blue)' }}><Plane size={20} /></div>
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{overview.onLeaveToday}</div>
            <div className="stat-label">On Leave</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent-yellow)' }}>
            <div className="stat-icon" style={{ background: 'rgba(255, 217, 61, 0.1)', color: 'var(--accent-yellow)' }}><AlertTriangle size={20} /></div>
            <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{overview.pendingLeaves}</div>
            <div className="stat-label">Pending Leaves</div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>{isAdmin ? 'Employees' : 'My Dashboard'}</h1>
        <div className="page-header-actions">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-employees"
            />
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowNewModal(true)} id="add-employee-btn">
              <Plus size={16} /> NEW
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="stat-cards" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ '--card-accent': 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user.id}`)}>
            <div className="stat-icon"><Users size={20} /></div>
            <div className="stat-label" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>My Profile</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent-green)', cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
            <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-green)' }}><Clock size={20} /></div>
            <div className="stat-label" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Attendance</div>
          </div>
          <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => navigate('/time-off')}>
            <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.1)', color: 'var(--accent-blue)' }}><Plane size={20} /></div>
            <div className="stat-label" style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Leave Requests</div>
          </div>
        </div>
      )}

      <div className="employee-grid">
        {filtered.map((emp) => (
          <div key={emp.id} className="employee-card" onClick={() => navigate(`/profile/${emp.id}`)}>
            <div className={`emp-status ${getStatusClass(emp)}`} title={getStatusClass(emp)} />
            {getStatusIcon(emp) && (
              <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 16 }}>{getStatusIcon(emp)}</span>
            )}
            <div className="emp-avatar">
              {emp.first_name?.[0]}{emp.last_name?.[0]}
            </div>
            <div className="emp-name">{emp.first_name} {emp.last_name}</div>
            <div className="emp-role">{emp.designation}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{emp.department}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No employees found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}

      {showNewModal && <NewEmployeeModal onClose={() => setShowNewModal(false)} onCreated={loadData} />}
    </div>
  );
}

function NewEmployeeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    department: 'Engineering', designation: 'Employee', role: 'employee', month_wage: '50000'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) { setError('Name and email are required'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api.signup({ ...form, month_wage: parseFloat(form.month_wage) });
      setResult(data);
      onCreated();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{result ? 'Employee Created' : 'Add New Employee'}</h2>
        
        {result ? (
          <div>
            <div className="success-msg">Employee account created successfully!</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Employee ID</p>
              <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>{result.employee_id}</p>
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Generated Password</p>
              <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-yellow)' }}>{result.generated_password}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Share this securely with the employee. They can change it after first login.</p>
            </div>
            <button className="btn btn-primary btn-full" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>First Name *</label>
                <input className="form-input" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="John" />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input className="form-input" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Doe" />
              </div>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@dayflow.com" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Department</label>
                <select className="form-select" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Human Resources</option>
                  <option>Finance</option>
                  <option>Operations</option>
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin / HR</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input className="form-input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Software Engineer" />
            </div>
            <div className="form-group">
              <label>Monthly Salary (₹)</label>
              <input className="form-input" type="number" value={form.month_wage} onChange={e => setForm({...form, month_wage: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Discard</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
