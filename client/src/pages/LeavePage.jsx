import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Plus, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Upload, 
  Paperclip, 
  Sparkles, 
  HeartHandshake, 
  PartyPopper,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function LeavePage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'requests' : 'my');
  const [leaveData, setLeaveData] = useState(null);
  const [allLeaves, setAllLeaves] = useState([]);
  const [allBalances, setAllBalances] = useState([]);
  const [selectedBalance, setSelectedBalance] = useState(null);
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
      if (activeTab === 'allocation' && isAdmin) {
        const data = await api.getLeaveBalances();
        setAllBalances(data);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpdateBalance = async (userId, paidTotal, sickTotal) => {
    try {
      await api.updateLeaveBalance({ user_id: userId, paid_total: paidTotal, sick_total: sickTotal });
      await loadData();
      setSelectedBalance(null);
    } catch (err) {
      alert(err.message);
    }
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
    const labels = { pending: 'Awaiting Approval', approved: 'Approved', rejected: 'Rejected' };
    return <span className={`badge ${map[status]}`}>{labels[status] || status}</span>;
  };

  const getLeaveTypeBadge = (type) => {
    const colors = { paid: 'var(--primary-light)', sick: 'var(--accent-red-light)', unpaid: 'var(--accent-yellow-light)' };
    const labels = { paid: 'Paid Time Off', sick: 'Sick Leave', unpaid: 'Unpaid Leave' };
    return <span style={{ color: colors[type] || 'var(--text-primary)', fontSize: 13.5, fontWeight: 700 }}>{labels[type] || type}</span>;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Time Off & Leaves</h1>
          <p>Request annual time off, submit sick leaves, and manage company balances</p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary btn-lg" onClick={() => setShowApplyModal(true)} id="new-leave-btn">
            <Plus size={18} />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="tabs">
          <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Leave Requests ({allLeaves.filter(l => l.status === 'pending').length} Pending)
          </button>
          <button className={`tab ${activeTab === 'allocation' ? 'active' : ''}`} onClick={() => setActiveTab('allocation')}>
            Workforce Leave Allocation
          </button>
          <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
            My Personal Leaves
          </button>
        </div>
      )}

      {/* EMPLOYEE VIEW - Leave Balance & History */}
      {(activeTab === 'my' || !isAdmin) && leaveData && (
        <div>
          {/* Balance Cards */}
          <div className="leave-balance-grid">
            <div className="leave-balance-card" style={{ borderTop: '3px solid var(--primary)' }}>
              <div className="leave-balance-title">Paid Time Off (PTO)</div>
              <div className="leave-balance-count" style={{ color: 'var(--primary-light)' }}>
                {leaveData.balance.paid_total - leaveData.balance.paid_used}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 6 }}>days left</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden', margin: '14px 0 8px' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (leaveData.balance.paid_used / Math.max(1, leaveData.balance.paid_total)) * 100)}%`, 
                    background: 'var(--primary-gradient)',
                    borderRadius: 3
                  }} 
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {leaveData.balance.paid_used} of {leaveData.balance.paid_total} allocated days used
              </div>
            </div>

            <div className="leave-balance-card" style={{ borderTop: '3px solid var(--accent-red)' }}>
              <div className="leave-balance-title">Sick Leave</div>
              <div className="leave-balance-count" style={{ color: 'var(--accent-red-light)' }}>
                {leaveData.balance.sick_total - leaveData.balance.sick_used}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 6 }}>days left</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden', margin: '14px 0 8px' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (leaveData.balance.sick_used / Math.max(1, leaveData.balance.sick_total)) * 100)}%`, 
                    background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
                    borderRadius: 3
                  }} 
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {leaveData.balance.sick_used} of {leaveData.balance.sick_total} medical days used
              </div>
            </div>

            <div className="leave-balance-card" style={{ borderTop: '3px solid var(--accent-yellow)' }}>
              <div className="leave-balance-title">Unpaid Time Off</div>
              <div className="leave-balance-count" style={{ color: 'var(--accent-yellow-light)' }}>
                {leaveData.balance.unpaid_used}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 6 }}>days taken</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden', margin: '14px 0 8px' }}>
                <div style={{ height: '100%', width: '100%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Deducted from monthly payroll calculation
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700 }}>My Request History</h3>
          {leaveData.requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', marginBottom: 32 }}>
              <Calendar size={32} style={{ opacity: 0.3, marginBottom: 10, display: 'block', margin: '0 auto' }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No leave requests submitted</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>Click Apply For Leave above to submit a new time off application.</p>
            </div>
          ) : (
            <div className="data-table-wrapper" style={{ marginBottom: 36 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Attachment</th>
                    <th>Status</th>
                    <th>HR Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveData.requests.map((r) => (
                    <tr key={r.id}>
                      <td>{getLeaveTypeBadge(r.leave_type)}</td>
                      <td style={{ fontWeight: 600 }}>{new Date(r.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ fontWeight: 600 }}>{new Date(r.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontWeight: 700 }}>
                          {r.days}d
                        </span>
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                      <td>
                        {r.attachment ? (
                          <a href={r.attachment} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 12 }}>
                            <Paperclip size={13} /> Proof
                          </a>
                        ) : '—'}
                      </td>
                      <td>{getStatusBadge(r.status)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.admin_comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Public Holidays Carousel */}
          {leaveData.holidays?.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PartyPopper size={20} color="var(--accent-yellow-light)" />
                <span>Upcoming Company Holidays ({new Date().getFullYear()})</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {leaveData.holidays.map((h) => (
                  <div key={h.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{h.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--primary-light)', marginTop: 2 }}>
                        {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span style={{ fontSize: 20 }}>🎉</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN VIEW - All Leave Requests */}
      {activeTab === 'requests' && isAdmin && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
              <select className="form-select" style={{ width: 180, padding: '8px 12px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Applications</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {allLeaves.length} requests
            </div>
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
                  <th>Proof</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allLeaves.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </div>
                        <div>
                          <div>{r.first_name} {r.last_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>{new Date(r.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{new Date(r.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{getLeaveTypeBadge(r.leave_type)}</td>
                    <td>
                      <span style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontWeight: 700 }}>
                        {r.days}d
                      </span>
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                    <td>
                      {r.attachment ? (
                        <a href={r.attachment} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
                          <Paperclip size={12} /> View
                        </a>
                      ) : '—'}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            className="form-input"
                            placeholder="Feedback..."
                            value={comments[r.id] || ''}
                            onChange={e => setComments({...comments, [r.id]: e.target.value})}
                            style={{ width: 120, padding: '6px 10px', fontSize: 12 }}
                          />
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(r.id)} title="Reject Application">
                            <X size={14} />
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)} title="Approve Application">
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
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leave requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN VIEW - Leave Allocation */}
      {activeTab === 'allocation' && isAdmin && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Paid Leaves (Available / Total)</th>
                <th>Sick Leaves (Available / Total)</th>
                <th>Unpaid Leaves Taken</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBalances.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
                        {b.first_name?.[0]}{b.last_name?.[0]}
                      </div>
                      <div>
                        <div>{b.first_name} {b.last_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td>{b.department}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{b.paid_total - b.paid_used}</span>
                    <span style={{ color: 'var(--text-secondary)' }}> / {b.paid_total} days</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>({b.paid_used} used)</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--accent-red-light)' }}>{b.sick_total - b.sick_used}</span>
                    <span style={{ color: 'var(--text-secondary)' }}> / {b.sick_total} days</span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>({b.sick_used} used)</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--accent-yellow-light)' }}>{b.unpaid_used}</span>
                    <span style={{ color: 'var(--text-secondary)' }}> days</span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBalance(b)}>
                      Edit Policy
                    </button>
                  </td>
                </tr>
              ))}
              {allBalances.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employee balances found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showApplyModal && (
        <ApplyLeaveModal 
          onClose={() => setShowApplyModal(false)} 
          onApplied={loadData} 
          userName={`${user.first_name} ${user.last_name}`} 
        />
      )}

      {selectedBalance && (
        <EditBalanceModal 
          balance={selectedBalance} 
          onClose={() => setSelectedBalance(null)} 
          onSave={handleUpdateBalance} 
        />
      )}
    </div>
  );
}

function EditBalanceModal({ balance, onClose, onSave }) {
  const [paidTotal, setPaidTotal] = useState(balance.paid_total);
  const [sickTotal, setSickTotal] = useState(balance.sick_total);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(balance.user_id, paidTotal, sickTotal);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>Adjust Leave Allocation</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 20 }}>
          Adjust annual leave quotas for <strong>{balance.first_name} {balance.last_name}</strong>.
        </p>
        
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius)', color: 'var(--accent-red-light)', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Paid Leaves Total (Per Year)</label>
            <input 
              type="number" 
              className="form-input" 
              value={paidTotal} 
              onChange={e => setPaidTotal(parseInt(e.target.value) || 0)} 
              min={balance.paid_used}
            />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Minimum: {balance.paid_used} (days already consumed)
            </span>
          </div>

          <div className="form-group">
            <label>Sick Leaves Total (Per Year)</label>
            <input 
              type="number" 
              className="form-input" 
              value={sickTotal} 
              onChange={e => setSickTotal(parseInt(e.target.value) || 0)} 
              min={balance.sick_used}
            />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Minimum: {balance.sick_used} (days already consumed)
            </span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Save Allocation'}
            </button>
          </div>
        </form>
      </div>
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
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(0);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const [sY, sM, sD] = form.start_date.split('-').map(Number);
      const [eY, eM, eD] = form.end_date.split('-').map(Number);
      const start = new Date(sY, sM - 1, sD);
      const end = new Date(eY, eM - 1, eD);
      let count = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) count++;
      }
      setDays(count);
    } else {
      setDays(0);
    }
  }, [form.start_date, form.end_date]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Attachment size must be less than 5MB');
        return;
      }
      const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        setError('Only .jpg, .jpeg, .png, and .pdf files are allowed');
        return;
      }
      setAttachmentFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) { 
      setError('Please select start and end dates'); 
      return; 
    }
    if (form.start_date > form.end_date) { 
      setError('End date cannot be earlier than start date'); 
      return; 
    }
    
    // Future Date Validation: Past date block with sick leave exemption
    if (form.leave_type !== 'sick' && form.start_date < todayStr) {
      setError('Leave start date cannot be in the past. Only sick leave may be applied retrospectively.');
      return;
    }

    // 0-Day Working Range Block
    if (days <= 0) {
      setError('Selected date range contains 0 working days (weekends only).');
      return;
    }

    if (form.leave_type === 'sick' && !attachmentFile) {
      setError('Medical certificate upload is required for sick leave requests.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('leave_type', form.leave_type);
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('reason', form.reason);
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      const token = localStorage.getItem('dayflow_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/leave/apply', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit leave request');
      }

      onApplied();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Apply for Time Off</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius)', color: 'var(--accent-red-light)', fontSize: 13.5, marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Applicant</label>
            <input className="form-input" value={userName} disabled style={{ opacity: 0.7 }} />
          </div>

          <div className="form-group">
            <label>Leave Category</label>
            <select 
              className="form-select" 
              value={form.leave_type} 
              onChange={e => setForm({...form, leave_type: e.target.value})}
            >
              <option value="paid">Paid Time Off (PTO)</option>
              <option value="sick">Sick Leave (Requires Medical Proof)</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input 
                className="form-input" 
                type="date" 
                value={form.start_date} 
                min={form.leave_type === 'sick' ? undefined : todayStr}
                onChange={e => setForm({...form, start_date: e.target.value})} 
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                className="form-input" 
                type="date" 
                value={form.end_date} 
                min={form.leave_type === 'sick' ? undefined : (form.start_date || todayStr)}
                onChange={e => setForm({...form, end_date: e.target.value})} 
                required
              />
            </div>
          </div>

          {days > 0 ? (
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--primary)', padding: '12px 18px', borderRadius: 'var(--radius)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600 }}>Total Working Days Requested:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)' }}>{days} {days === 1 ? 'day' : 'days'}</span>
            </div>
          ) : (form.start_date && form.end_date && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-red)', padding: 12, borderRadius: 'var(--radius)', marginBottom: 20, textAlign: 'center', color: 'var(--accent-red-light)', fontSize: 13 }}>
              0 working days selected (weekend dates only)
            </div>
          ))}

          <div className="form-group">
            <label>Reason / Notes</label>
            <textarea 
              className="form-textarea" 
              value={form.reason} 
              onChange={e => setForm({...form, reason: e.target.value})} 
              placeholder="Provide a brief explanation for your time off request..." 
            />
          </div>

          {/* Medical Attachment Dropzone */}
          {form.leave_type === 'sick' ? (
            <div className="form-group">
              <label style={{ color: 'var(--accent-red-light)' }}>
                Medical Proof Certificate (Required for Sick Leave) *
              </label>
              <div style={{ border: '2px dashed var(--accent-red)', background: 'rgba(244, 63, 94, 0.05)', borderRadius: 'var(--radius)', padding: 20, textAlign: 'center' }}>
                {attachmentFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={20} color="var(--accent-red-light)" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setAttachmentFile(null)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Upload size={24} color="var(--accent-red-light)" />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to upload Doctor Note / Certificate (PDF, JPG, PNG - max 5MB)</span>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange} 
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Supporting Document (Optional)</label>
              <div style={{ border: '1px dashed var(--border)', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius)', padding: 18, textAlign: 'center' }}>
                {attachmentFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} color="var(--primary-light)" />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{attachmentFile.name}</span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttachmentFile(null)}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Upload size={20} color="var(--text-muted)" />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Upload optional document (flight tickets, itinerary, etc.)</span>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange} 
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Discard</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
