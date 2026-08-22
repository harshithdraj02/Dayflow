import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Search, DollarSign, Download, Eye, Edit2, TrendingUp, ShieldCheck, CreditCard, X, ChevronRight } from 'lucide-react';
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
    `${p.first_name || ''} ${p.last_name || ''} ${p.employee_id || ''} ${p.department || ''}`.toLowerCase().includes((search || '').toLowerCase())
  );

  const totalMonthlyPayout = payrolls.reduce((sum, p) => sum + (p.month_wage || 0), 0);
  const totalNetTakeHome = payrolls.reduce((sum, p) => sum + (p.net_salary_adjusted || p.net_salary || 0), 0);
  const totalPF = payrolls.reduce((sum, p) => sum + (p.pf_employee || 0) + (p.pf_employer || 0), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Payroll & Compensation Management</h1>
          <p>Automated salary calculation, PF deductions, tax withholdings, and payslips</p>
        </div>

        <div className="page-header-actions">
          <div className="search-bar-modern">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search payroll by employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="search-payroll"
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Admin */}
      {isAdmin && (
        <div className="stat-cards-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <div className="stat-card-info">
              <span className="stat-card-label">Monthly Gross Disbursal</span>
              <span className="stat-card-value">{fmt(totalMonthlyPayout)}</span>
              <span className="stat-card-sub">Total monthly CTC commitment</span>
            </div>
            <div className="stat-card-icon-box">
              <CreditCard size={24} />
            </div>
          </div>

          <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #10b981, #059669)', '--icon-bg': 'rgba(16, 185, 129, 0.15)', '--icon-color': 'var(--accent-green-light)' }}>
            <div className="stat-card-info">
              <span className="stat-card-label">Net Take-Home Outflow</span>
              <span className="stat-card-value" style={{ color: 'var(--accent-green-light)' }}>{fmt(totalNetTakeHome)}</span>
              <span className="stat-card-sub">After taxes and LOP deductions</span>
            </div>
            <div className="stat-card-icon-box">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #06b6d4, #3b82f6)', '--icon-bg': 'rgba(6, 182, 212, 0.15)', '--icon-color': 'var(--secondary-light)' }}>
            <div className="stat-card-info">
              <span className="stat-card-label">Total PF Fund Pool</span>
              <span className="stat-card-value" style={{ color: 'var(--secondary-light)' }}>{fmt(totalPF)}</span>
              <span className="stat-card-sub">Combined Employee + Employer PF</span>
            </div>
            <div className="stat-card-icon-box">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Payroll Records Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Gross Monthly</th>
              <th>Net Take-Home</th>
              <th>PF Contribution</th>
              <th>Professional Tax</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.employee_id}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.designation}</div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.department}</td>
                <td style={{ fontWeight: 700 }}>{fmt(p.month_wage)}</td>
                <td style={{ fontWeight: 800, color: 'var(--accent-green-light)' }}>
                  {fmt(p.net_salary_adjusted || p.net_salary)}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{fmt(p.pf_employee)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{fmt(p.professional_tax)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => navigate(`/profile/${p.user_id}`)} 
                      title="View Breakdown / Payslip"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                    {isAdmin && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => { setEditingUser(p); setEditWage(String(p.month_wage)); }} 
                        title="Adjust Salary"
                      >
                        <Edit2 size={14} />
                        <span>Adjust</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  No payroll records found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Salary Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Adjust Salary Compensation</h2>
              <button className="modal-close" onClick={() => setEditingUser(null)}><X size={18} /></button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 13.5, lineHeight: 1.5 }}>
              Recalculating monthly package for <strong>{editingUser.first_name} {editingUser.last_name}</strong> ({editingUser.employee_id}).
              Statutory breakdown components (Basic 50%, HRA, Standard Allowance, Performance Bonus, PF, and Professional Tax) will automatically recalculate.
            </p>

            <form onSubmit={handleUpdateSalary}>
              <div className="form-group">
                <label>New Monthly Gross Wage (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editWage}
                  onChange={e => setEditWage(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {editWage && !isNaN(parseFloat(editWage)) && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Estimated Take-Home Preview</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Basic Salary (50%):</span>
                    <span style={{ fontWeight: 600 }}>{fmt(parseFloat(editWage) * 0.5)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estimated PF Employee (12%):</span>
                    <span style={{ color: 'var(--accent-red-light)', fontWeight: 600 }}>-{fmt(parseFloat(editWage) * 0.5 * 0.12)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6 }}>
                    <span style={{ fontWeight: 700 }}>Estimated Net Take-Home:</span>
                    <span style={{ color: 'var(--accent-green-light)', fontWeight: 800 }}>
                      {fmt(parseFloat(editWage) - (parseFloat(editWage) * 0.5 * 0.12) - 200)}
                    </span>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Updating Package...' : 'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
