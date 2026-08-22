import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Plus, Check, X, Calendar, Clock } from 'lucide-react';

export default function LeavePage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'requests' : 'my');
  const [leaveData, setLeaveData] = useState(null);
  const [allLeaves, setAllLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});

  useEffect(() => { loadData(); }, [activeTab, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my' || !isAdmin) {
        const data = await api.getMyLeaves();
        setLeaveData(data);
      }
      if (activeTab === 'requests' && isAdmin) {
        const data = await api.getAllLeaves(filterStatus);
        setAllLeaves(data);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      await api.approveLeave(id, comments[id] || '');
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectLeave(id, comments[id] || '');
      await loadData();
    } catch (err) { alert(err.message); }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' };
    const labels = { pending: 'To Approve', approved: 'Validated', rejected: 'Refused' };
    return <span className={`badge ${map[status]}`}>{labels[status] || status}</span>;
  };

  const getLeaveTypeBadge = (type) => {
    const colors = { paid: 'var(--primary)', sick: 'var(--accent-red)', unpaid: 'var(--accent-yellow)' };
    const labels = { paid: 'Paid Time Off', sick: 'Sick Leave', unpaid: 'Unpaid Leave' };
    return <span style={{ color: colors[type], fontSize: 13, fontWeight: 600 }}>{labels[type] || type}</span>;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Time Off</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)} id="new-leave-btn">
            <Plus size={16} /> NEW
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="tabs">
          <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Time Off</button>
          <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Leaves</button>
        </div>
      )}

      {/* EMPLOYEE VIEW - Leave Balance & History */}
      {(activeTab === 'my' || !isAdmin) && leaveData && (
        <div>
          <div className="leave-stats">
            <div className="leave-stat-card">
              <div className="leave-type">Paid Time Off</div>
              <div className="leave-count">{leaveData.balance.paid_total - leaveData.balance.paid_used}</div>
              <div className="leave-unit">Days Available</div>
              <div className="leave-bar">
                <div className="leave-bar-fill" style={{
                  width: `${(leaveData.balance.paid_used / leaveData.balance.paid_total) * 100}%`,
                  background: 'var(--primary)'
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {leaveData.balance.paid_used} of {leaveData.balance.paid_total} used
              </div>
            </div>
            <div className="leave-stat-card">
              <div className="leave-type">Sick Time Off</div>
              <div className="leave-count">{leaveData.balance.sick_total - leaveData.balance.sick_used}</div>
              <div className="leave-unit">Days Available</div>
              <div className="leave-bar">
                <div className="leave-bar-fill" style={{
                  width: `${(leaveData.balance.sick_used / leaveData.balance.sick_total) * 100}%`,
                  background: 'var(--accent-red)'
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {leaveData.balance.sick_used} of {leaveData.balance.sick_total} used
              </div>
            </div>
            <div className="leave-stat-card">
              <div className="leave-type">Unpaid Leaves Taken</div>
              <div className="leave-count">{leaveData.balance.unpaid_used}</div>
              <div className="leave-unit">Days</div>
            </div>
          </div>

          <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>My Leave Requests</h3>
          {leaveData.requests.length === 0 ? (
            <div className="empty-state"><h3>No leave requests yet</h3><p>Click NEW to apply for time off</p></div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveData.requests.map((r) => (
                    <tr key={r.id}>
                      <td>{getLeaveTypeBadge(r.leave_type)}</td>
                      <td>{new Date(r.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td>{new Date(r.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                      <td>{r.days}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                      <td>{getStatusBadge(r.status)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.admin_comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Public Holidays */}
          {leaveData.holidays?.length > 0 && (
            <div className="holidays-section">
              <h3>🎉 Public Holidays {new Date().getFullYear()}</h3>
              {leaveData.holidays.map((h) => (
                <div key={h.id} className="holiday-item">
                  <span className="holiday-name">{h.name}</span>
                  <span className="holiday-date">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN VIEW - All Leave Requests */}
      {activeTab === 'requests' && isAdmin && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <select className="form-select" style={{ width: 200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Type</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allLeaves.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="emp-mini-avatar" style={{
                          width: 28, height: 28, borderRadius: '50%', fontSize: 10,
                          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </div>
                        {r.first_name} {r.last_name}
                      </div>
                    </td>
                    <td>{new Date(r.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{new Date(r.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{getLeaveTypeBadge(r.leave_type)}</td>
                    <td>{r.days}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            className="leave-comment-input"
                            placeholder="Comment..."
                            value={comments[r.id] || ''}
                            onChange={e => setComments({...comments, [r.id]: e.target.value})}
                            style={{ width: 120, padding: '6px 10px' }}
                          />
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)} title="Reject">
                            <X size={14} />
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)} title="Approve">
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.admin_comment || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {allLeaves.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No leave requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showApplyModal && <ApplyLeaveModal onClose={() => setShowApplyModal(false)} onApplied={loadData} userName={`${user.first_name} ${user.last_name}`} />}
    </div>
  );
}

function ApplyLeaveModal({ onClose, onApplied, userName }) {
  const [form, setForm] = useState({
    leave_type: 'paid',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(0);

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      let count = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) count++;
      }
      setDays(count);
    } else {
      setDays(0);
    }
  }, [form.start_date, form.end_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) { setError('Please select dates'); return; }
    if (days <= 0) { setError('Invalid date range'); return; }
    setError('');
    setLoading(true);
    try {
      await api.applyLeave(form);
      onApplied();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Create Time Off</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee</label>
            <input className="form-input" value={userName} disabled style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label>Time Off Type</label>
            <select className="form-select" value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})}>
              <option value="paid">Paid Time Off</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Start Date</label>
              <input className="form-input" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input className="form-input" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
            </div>
          </div>
          {days > 0 && (
            <div style={{ background: 'var(--primary-glow)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 16, textAlign: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 20 }}>{days}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 6 }}>working day{days > 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="form-group">
            <label>Reason / Description</label>
            <textarea className="form-textarea" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Reason for time off..." />
          </div>
          {form.leave_type === 'sick' && (
            <div style={{ background: 'rgba(255, 107, 107, 0.1)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13, color: 'var(--accent-red)' }}>
              📎 Note: Sick leave may require a medical certificate attachment.
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Discard</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
