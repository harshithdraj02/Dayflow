import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Pencil, X, Plus, Save, Mail, Phone, MapPin, Building, Briefcase, Calendar, Download, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const profileId = id ? parseInt(id) : user.id;
  const [profile, setProfile] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [activeTab, setActiveTab] = useState('private');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' });
  const [editWage, setEditWage] = useState('');
  const [savingWage, setSavingWage] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployee(profileId);
      setProfile(data);
      setEditForm({
        phone: data.phone || '',
        address: data.address || '',
        about: data.about || '',
        job_love: data.job_love || '',
        interests: data.interests || '',
        department: data.department || '',
        designation: data.designation || '',
        location: data.location || '',
      });
      try {
        const p = await api.getPayroll(profileId);
        setPayroll(p);
        setEditWage(String(p.month_wage || ''));
      } catch { /* no payroll */ }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.updateEmployee(profileId, editForm);
      await loadProfile();
      setEditing(false);
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const handleDeleteEmployee = async () => {
    if (!window.confirm(`Are you sure you want to offboard and permanently delete ${profile.first_name} ${profile.last_name}? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteEmployee(profileId);
      alert(`Employee ${profile.first_name} ${profile.last_name} has been offboarded successfully.`);
      navigate('/');
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name) return;
    try {
      await api.addSkill(profileId, newSkill);
      setNewSkill({ name: '', level: 'Intermediate' });
      setShowAddSkill(false);
      await loadProfile();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await api.deleteSkill(profileId, skillId);
      await loadProfile();
    } catch (err) { alert(err.message); }
  };

  const handleAddCert = async () => {
    if (!newCert.name) return;
    try {
      await api.addCertification(profileId, newCert);
      setNewCert({ name: '', issuer: '', date: '' });
      setShowAddCert(false);
      await loadProfile();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteCert = async (certId) => {
    try {
      await api.deleteCertification(profileId, certId);
      await loadProfile();
    } catch (err) { alert(err.message); }
  };

  const handleUpdateWage = async () => {
    setSavingWage(true);
    try {
      await api.updatePayroll(profileId, { month_wage: parseFloat(editWage) });
      await loadProfile();
    } catch (err) { alert(err.message); }
    setSavingWage(false);
  };

  const canEdit = isAdmin || user.id === profileId;

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!profile) return <div className="empty-state"><h3>Profile not found</h3></div>;

  return (
    <div className="profile-layout">
      <div className="profile-sidebar">
        <div className="profile-avatar">
          {profile.first_name?.[0]}{profile.last_name?.[0]}
        </div>
        <div className="profile-name">{profile.first_name} {profile.last_name}</div>
        <div className="profile-designation">{profile.designation}</div>
        <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-employee'}`}>{profile.role}</span>

        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <div className="profile-info-item">
            <Mail size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Email</div>
              <div className="value" style={{ fontSize: 12, wordBreak: 'break-all' }}>{profile.email}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">ID</div>
              <div className="value" style={{ fontSize: 12, fontFamily: 'monospace' }}>{profile.employee_id}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Phone size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Mobile</div>
              <div className="value">{profile.phone || '—'}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Building size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Department</div>
              <div className="value">{profile.department}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Location</div>
              <div className="value">{profile.location}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Joined</div>
              <div className="value">{profile.join_date ? new Date(profile.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Building size={14} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Company</div>
              <div className="value">{profile.company_name}</div>
            </div>
          </div>
        </div>

        {/* Offboard Employee Button: Admin only & not self account */}
        {isAdmin && user.id !== profileId && (
          <button
            className="btn btn-danger"
            style={{ width: '100%', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={handleDeleteEmployee}
            disabled={deleting}
            id="offboard-employee-btn"
          >
            <Trash2 size={15} /> {deleting ? 'Offboarding...' : 'Delete Employee Account'}
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>Private Info</button>
          <button className={`profile-tab ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>Resume</button>
          {(isAdmin || user.id === profileId) && <button className={`profile-tab ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>Salary Info</button>}
        </div>

        <div className="profile-tab-content">
          {activeTab === 'private' && (
            <div>
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: 18 }}>Personal Information</h3>
                {canEdit && !editing && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</button>
                )}
                {editing && (
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3>About <Pencil size={14} className="edit-icon" onClick={() => setEditing(true)} /></h3>
                {editing ? (
                  <textarea className="form-textarea" value={editForm.about} onChange={e => setEditForm({...editForm, about: e.target.value})} placeholder="Tell us about yourself..." />
                ) : (
                  <p>{profile.about || 'No information added yet.'}</p>
                )}
              </div>

              <div className="profile-section">
                <h3>What I love about my job <Pencil size={14} className="edit-icon" onClick={() => setEditing(true)} /></h3>
                {editing ? (
                  <textarea className="form-textarea" value={editForm.job_love} onChange={e => setEditForm({...editForm, job_love: e.target.value})} placeholder="What do you love about your job?" />
                ) : (
                  <p>{profile.job_love || 'No information added yet.'}</p>
                )}
              </div>

              <div className="profile-section">
                <h3>My interests and hobbies <Pencil size={14} className="edit-icon" onClick={() => setEditing(true)} /></h3>
                {editing ? (
                  <textarea className="form-textarea" value={editForm.interests} onChange={e => setEditForm({...editForm, interests: e.target.value})} placeholder="What are your interests?" />
                ) : (
                  <p>{profile.interests || 'No information added yet.'}</p>
                )}
              </div>

              {editing && (
                <>
                  <div className="profile-section">
                    <h3>Contact Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label>Phone</label>
                        <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="profile-section">
                      <h3>Job Details (Admin)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                          <label>Department</label>
                          <input className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Designation</label>
                          <input className="form-input" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'resume' && (
            <div>
              <div className="profile-section">
                <h3>Skills</h3>
                <div className="skills-grid">
                  {profile.skills?.map((skill) => (
                    <div key={skill.id} className="skill-tag">
                      {skill.name}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({skill.level})</span>
                      {canEdit && (
                        <button className="remove-skill" onClick={() => handleDeleteSkill(skill.id)}><X size={12} /></button>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    <button className="add-skill-btn" onClick={() => setShowAddSkill(true)}>
                      <Plus size={14} /> Add Skills
                    </button>
                  )}
                </div>
                {showAddSkill && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label>Skill Name</label>
                      <input className="form-input" value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} placeholder="e.g. React" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Level</label>
                      <select className="form-select" value={newSkill.level} onChange={e => setNewSkill({...newSkill, level: e.target.value})}>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                        <option>Expert</option>
                      </select>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleAddSkill}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSkill(false)}><X size={14} /></button>
                  </div>
                )}
              </div>

              <div className="profile-section" style={{ marginTop: 24 }}>
                <h3>Certification</h3>
                {profile.certifications?.map((cert) => (
                  <div key={cert.id} className="cert-card">
                    <div>
                      <div className="cert-name">{cert.name}</div>
                      <div className="cert-issuer">{cert.issuer} {cert.date && `• ${cert.date}`}</div>
                    </div>
                    {canEdit && (
                      <button className="remove-cert" onClick={() => handleDeleteCert(cert.id)} title="Remove certification">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <button className="add-skill-btn" onClick={() => setShowAddCert(true)} style={{ marginTop: 8 }}>
                    <Plus size={14} /> Add Certification
                  </button>
                )}
                {showAddCert && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, marginTop: 12, alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Name</label>
                      <input className="form-input" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} placeholder="Certification name" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Issuer</label>
                      <input className="form-input" value={newCert.issuer} onChange={e => setNewCert({...newCert, issuer: e.target.value})} placeholder="Issuing org" />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleAddCert}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCert(false)}><X size={14} /></button>
                  </div>
                )}
                {(!profile.certifications || profile.certifications.length === 0) && !showAddCert && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No certifications added yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'salary' && (isAdmin || user.id === profileId) && payroll && (
            <div>
              <div className="flex-between mb-16 no-print">
                <h3 style={{ fontSize: 18 }}>Salary Details</h3>
                <button className="btn btn-secondary btn-sm flex items-center gap-4" onClick={() => window.print()}>
                  <Download size={14} /> Download Payslip
                </button>
              </div>

              <div className="salary-grid no-print">
                <div className="salary-card">
                  <div className="salary-label">Month Wage</div>
                  <div className="salary-value">{fmt(payroll.month_wage)} <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>/ Month</span></div>
                </div>
                <div className="salary-card">
                  <div className="salary-label">Yearly Wage</div>
                  <div className="salary-value">{fmt(payroll.yearly_wage)} <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>/ Year</span></div>
                </div>
              </div>

              {isAdmin && (
                <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Update Monthly Wage (₹)</label>
                    <input className="form-input" type="number" value={editWage} onChange={e => setEditWage(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleUpdateWage} disabled={savingWage}>
                    {savingWage ? 'Saving...' : 'Update Salary'}
                  </button>
                </div>
              )}

              {/* Printable Corporate Payslip */}
              <div id="payslip-to-print" className="payslip-document">
                <div className="payslip-header-print">
                  <div className="payslip-comp-name">{profile.company_name || 'DAYFLOW HRMS'}</div>
                  <div className="payslip-title">SALARY PAYSLIP</div>
                  <div className="payslip-period">For the Month of {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</div>
                </div>

                <div className="payslip-meta-grid">
                  <div>
                    <strong>Employee ID:</strong> <span>{profile.employee_id}</span>
                  </div>
                  <div>
                    <strong>Employee Name:</strong> <span>{profile.first_name} {profile.last_name}</span>
                  </div>
                  <div>
                    <strong>Department:</strong> <span>{profile.department}</span>
                  </div>
                  <div>
                    <strong>Designation:</strong> <span>{profile.designation}</span>
                  </div>
                  <div>
                    <strong>Location:</strong> <span>{profile.location}</span>
                  </div>
                  <div>
                    <strong>PF Account:</strong> <span>PF-{profile.employee_id}</span>
                  </div>
                </div>

                <div className="payslip-columns">
                  <div className="salary-breakdown">
                    <div className="salary-breakdown-header">Salary Earnings Components</div>
                    <div className="salary-row">
                      <span className="label">Basic Salary <span className="hint">(50% of Gross)</span></span>
                      <span className="value">{fmt(payroll.basic_salary)}</span>
                    </div>
                    <div className="salary-row">
                      <span className="label">House Rent Allowance (HRA) <span className="hint">(50% of Basic)</span></span>
                      <span className="value">{fmt(payroll.hra)}</span>
                    </div>
                    <div className="salary-row">
                      <span className="label">Standard Allowance <span className="hint">(16.67% of Basic)</span></span>
                      <span className="value">{fmt(payroll.standard_allowance)}</span>
                    </div>
                    <div className="salary-row">
                      <span className="label">Performance Bonus <span className="hint">(8.33% of Basic)</span></span>
                      <span className="value">{fmt(payroll.performance_bonus)}</span>
                    </div>
                    <div className="salary-row">
                      <span className="label">Leave Travel Allowance (LTA) <span className="hint">(8.33% of Basic)</span></span>
                      <span className="value">{fmt(payroll.lta)}</span>
                    </div>
                    <div className="salary-row">
                      <span className="label">Fixed Allowance <span className="hint">(Remainder)</span></span>
                      <span className="value">{fmt(payroll.fixed_allowance)}</span>
                    </div>
                  </div>

                  <div className="salary-breakdown">
                    <div className="salary-breakdown-header">Salary Deductions</div>
                    <div className="salary-row deduction">
                      <span className="label">PF – Employee Contribution <span className="hint">(12% of Basic)</span></span>
                      <span className="value">-{fmt(payroll.pf_employee)}</span>
                    </div>
                    <div className="salary-row deduction">
                      <span className="label">PF – Employer Contribution <span className="hint">(12% of Basic)</span></span>
                      <span className="value">{fmt(payroll.pf_employer)}</span>
                    </div>
                    <div className="salary-row deduction">
                      <span className="label">Professional Tax</span>
                      <span className="value">-{fmt(payroll.professional_tax)}</span>
                    </div>
                    {payroll.unpaid_days_this_month > 0 && (
                      <div className="salary-row deduction" style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                        <span className="label">Loss of Pay (LOP) Deduction <span className="hint">({payroll.unpaid_days_this_month} Unpaid Days Taken)</span></span>
                        <span className="value">-{fmt(payroll.lop_deduction)}</span>
                      </div>
                    )}
                    <div className="salary-row total">
                      <span className="label">Net Salary Adjusted (Take Home)</span>
                      <span className="value" style={{ color: 'var(--accent-green)' }}>{fmt(payroll.net_salary_adjusted)}</span>
                    </div>
                  </div>
                </div>

                <div className="payslip-footer-print">
                  <div className="payslip-sign-box">
                    <div className="line"></div>
                    <div>Employee Signature</div>
                  </div>
                  <div className="payslip-sign-box">
                    <div className="line"></div>
                    <div>Authorized HR Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
