import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Pencil, 
  X, 
  Plus, 
  Save, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Briefcase, 
  Calendar, 
  Download, 
  Trash2, 
  Camera,
  Award,
  Sparkles,
  DollarSign,
  Heart,
  BookOpen
} from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, refreshUser } = useAuth();
  const profileId = id ? parseInt(id) : user.id;
  const [profile, setProfile] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [activeTab, setActiveTab] = useState('private');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      await api.uploadAvatar(profileId, formData);
      await loadProfile();
      if (user.id === profileId && refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      alert(err.message);
    }
    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove this profile photo?')) return;
    setUploadingAvatar(true);
    try {
      await api.removeAvatar(profileId);
      await loadProfile();
      if (user.id === profileId && refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      alert(err.message);
    }
    setUploadingAvatar(false);
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
      {/* Left Profile Sidebar Showcase */}
      <div className="profile-sidebar">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt="Profile" className="profile-avatar-img" />
            ) : (
              <span>{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
            )}
            {canEdit && (
              <label className="profile-avatar-overlay" title="Upload Profile Picture">
                <Camera size={13} />
                <span>{uploadingAvatar ? '...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  disabled={uploadingAvatar}
                  onChange={handleAvatarUpload}
                />
              </label>
            )}
          </div>
          {canEdit && profile.profile_picture && (
            <button
              type="button"
              className="remove-avatar-btn"
              onClick={handleRemoveAvatar}
              disabled={uploadingAvatar}
              title="Remove profile photo"
            >
              Remove photo
            </button>
          )}
        </div>

        <div className="profile-name">{profile.first_name} {profile.last_name}</div>
        <div className="profile-designation">{profile.designation || 'Team Member'}</div>
        <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-employee'}`}>
          {profile.role}
        </span>

        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <div className="profile-info-item">
            <Mail size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Work Email</div>
              <div className="value" style={{ wordBreak: 'break-all' }}>{profile.email}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Briefcase size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Employee ID</div>
              <div className="value" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{profile.employee_id}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Phone size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Mobile</div>
              <div className="value">{profile.phone || '—'}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Building size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Department</div>
              <div className="value">{profile.department}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Location</div>
              <div className="value">{profile.location || 'Bangalore HQ'}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div className="label">Join Date</div>
              <div className="value">
                {profile.join_date ? new Date(profile.join_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Offboard Employee Button: Admin only & not self */}
        {isAdmin && user.id !== profileId && (
          <button
            className="btn btn-danger btn-full"
            style={{ marginTop: 28 }}
            onClick={handleDeleteEmployee}
            disabled={deleting}
            id="offboard-employee-btn"
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Offboarding...' : 'Delete Employee Account'}</span>
          </button>
        )}
      </div>

      {/* Main Profile Tabs Content */}
      <div>
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'private' ? 'active' : ''}`} 
            onClick={() => setActiveTab('private')}
          >
            Personal & About
          </button>
          <button 
            className={`tab ${activeTab === 'resume' ? 'active' : ''}`} 
            onClick={() => setActiveTab('resume')}
          >
            Skills & Certifications
          </button>
          {(isAdmin || user.id === profileId) && (
            <button 
              className={`tab ${activeTab === 'salary' ? 'active' : ''}`} 
              onClick={() => setActiveTab('salary')}
            >
              Compensation & Payroll
            </button>
          )}
        </div>

        <div className="profile-main-card">
          {/* TAB 1: Personal & Bio */}
          {activeTab === 'private' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>About & Passions</h3>
                {canEdit && !editing && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                    <Pencil size={14} /> Edit Bio
                  </button>
                )}
                {editing && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                      <X size={14} /> Cancel
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                      <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} /> About Me
                </div>
                {editing ? (
                  <textarea 
                    className="form-textarea" 
                    value={editForm.about} 
                    onChange={e => setEditForm({...editForm, about: e.target.value})} 
                    placeholder="Write a brief professional background..." 
                  />
                ) : (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14.5 }}>
                    {profile.about || 'No bio written yet.'}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Heart size={16} /> What I Love About My Job
                </div>
                {editing ? (
                  <textarea 
                    className="form-textarea" 
                    value={editForm.job_love} 
                    onChange={e => setEditForm({...editForm, job_love: e.target.value})} 
                    placeholder="What drives and inspires you at work..." 
                  />
                ) : (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14.5 }}>
                    {profile.job_love || 'No notes added yet.'}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={16} /> Interests & Hobbies
                </div>
                {editing ? (
                  <textarea 
                    className="form-textarea" 
                    value={editForm.interests} 
                    onChange={e => setEditForm({...editForm, interests: e.target.value})} 
                    placeholder="Your hobbies, activities outside work..." 
                  />
                ) : (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14.5 }}>
                    {profile.interests || 'No hobbies listed yet.'}
                  </p>
                )}
              </div>

              {editing && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Contact & Job Updates</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Residential Address</label>
                      <input className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Department (Admin Only)</label>
                        <input className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Designation (Admin Only)</label>
                        <input className="form-input" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Skills & Certifications */}
          {activeTab === 'resume' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Technical & Domain Skills</h3>
                {canEdit && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddSkill(true)}>
                    <Plus size={14} /> Add Skill
                  </button>
                )}
              </div>

              <div className="skills-cloud">
                {profile.skills?.map((skill) => (
                  <div key={skill.id} className="skill-pill">
                    <span>{skill.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--primary-light)', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 6px', borderRadius: 4 }}>
                      {skill.level}
                    </span>
                    {canEdit && (
                      <button className="skill-remove-btn" onClick={() => handleDeleteSkill(skill.id)} title="Remove skill">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>No skills added yet.</p>
                )}
              </div>

              {showAddSkill && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'end', background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Skill Name</label>
                    <input 
                      className="form-input" 
                      value={newSkill.name} 
                      onChange={e => setNewSkill({...newSkill, name: e.target.value})} 
                      placeholder="e.g. React, Node.js, UI/UX" 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, width: 150 }}>
                    <label>Proficiency</label>
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

              {/* Certifications Section */}
              <div style={{ marginTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Certifications & Honors</h3>
                  {canEdit && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCert(true)}>
                      <Plus size={14} /> Add Certification
                    </button>
                  )}
                </div>

                <div className="certs-grid">
                  {profile.certifications?.map((cert) => (
                    <div key={cert.id} className="cert-card">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Award size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{cert.name}</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {cert.issuer} {cert.date && `• ${cert.date}`}
                          </div>
                        </div>
                      </div>
                      {canEdit && (
                        <button className="cert-card-remove" onClick={() => handleDeleteCert(cert.id)} title="Delete Certification">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {showAddCert && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, marginTop: 16, alignItems: 'end', background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Certificate Name</label>
                      <input className="form-input" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} placeholder="AWS Certified Solutions Architect" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Issuing Organization / Year</label>
                      <input className="form-input" value={newCert.issuer} onChange={e => setNewCert({...newCert, issuer: e.target.value})} placeholder="Amazon Web Services (2025)" />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleAddCert}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCert(false)}><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Compensation & Payroll */}
          {activeTab === 'salary' && (isAdmin || user.id === profileId) && payroll && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Compensation Package</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  <Download size={14} /> Download Official Payslip
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Gross Wage</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                    {fmt(payroll.month_wage)}
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 6 }}>/ Month</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Annual Cost To Company (CTC)</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent-green-light)', marginTop: 4 }}>
                    {fmt(payroll.yearly_wage)}
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 6 }}>/ Year</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 28, alignItems: 'end', background: 'var(--bg-elevated)', padding: 18, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Admin Compensation Adjustment (₹ / Month)</label>
                    <input className="form-input" type="number" value={editWage} onChange={e => setEditWage(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" onClick={handleUpdateWage} disabled={savingWage}>
                    {savingWage ? 'Updating...' : 'Update Base Wage'}
                  </button>
                </div>
              )}

              {/* Salary Breakdown Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    Earnings Components
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Basic Salary (50%)</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.basic_salary)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>House Rent Allowance (HRA)</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.hra)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Standard Allowance</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.standard_allowance)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Performance Bonus</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.performance_bonus)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Leave Travel Allowance</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.lta)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Fixed Allowance</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.fixed_allowance)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-red-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
                    Statutory Deductions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Provident Fund (Employee 12%)</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-red-light)' }}>-{fmt(payroll.pf_employee)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>PF Employer Contribution</span>
                      <span style={{ fontWeight: 600 }}>{fmt(payroll.pf_employer)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Professional Tax</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-red-light)' }}>-{fmt(payroll.professional_tax)}</span>
                    </div>
                    {payroll.unpaid_days_this_month > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red-light)' }}>
                        <span>Loss of Pay ({payroll.unpaid_days_this_month} unpaid days)</span>
                        <span style={{ fontWeight: 700 }}>-{fmt(payroll.lop_deduction)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6 }}>
                      <span style={{ fontWeight: 700 }}>Net Take-Home Pay</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent-green-light)' }}>
                        {fmt(payroll.net_salary_adjusted || payroll.net_salary)}
                      </span>
                    </div>
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
