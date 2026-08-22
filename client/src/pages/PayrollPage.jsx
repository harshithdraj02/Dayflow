import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Search, DollarSign, Download, Eye, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PayrollPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editWage, setEditWage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await api.getAllPayroll();
        setPayrolls(data);
      } else {
        const p = await api.getMyPayroll();
        setPayrolls([{ ...p, first_name: user.first_name, last_name: user.last_name, employee_id: user.employee_id, department: user.department, designation: user.designation }]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    if (!editingUser || !editWage || parseFloat(editWage) <= 0) return;
    setSaving(true);
    try {
      await api.updatePayroll(editingUser.user_id, { month_wage: parseFloat(editWage) });
      setEditingUser(null);
      await loadPayrolls();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

  const filtered = payrolls.filter(p =>
    `${p.first_name} ${p.last_name} ${p.employee_id} ${p.department}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Payroll Management</h1>
        <div className="page-header-actions">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search payroll..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-payroll"
            />
          </div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Gross Monthly</th>
              <th>Net Take-Home</th>
              <th>PF Contribution (Emp)</th>
              <th>Professional Tax</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.employee_id}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.designation}</div>
                </td>
                <td>{p.department}</td>
                <td style={{ fontWeight: 600 }}>{fmt(p.month_wage)}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{fmt(p.net_salary_adjusted)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{fmt(p.pf_employee)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{fmt(p.professional_tax)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/profile/${p.user_id}`)} title="View Profile / Calculation Breakup">
                      <Eye size={14} />
                    </button>
                    {isAdmin && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setEditingUser(p); setEditWage(String(p.month_wage)); }} title="Adjust Salary">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No payroll records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal">
            <h2>Adjust Salary</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
              Updating salary for <strong>{editingUser.first_name} {editingUser.last_name}</strong> ({editingUser.employee_id}).
              The salary components (Basic, HRA, Standard Allowance, PF deductions, Professional Tax) will be recalculated automatically based on the new monthly gross.
            </p>
            <form onSubmit={handleUpdateSalary}>
              <div className="form-group">
                <label>New Monthly Gross Salary (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editWage}
                  onChange={e => setEditWage(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
