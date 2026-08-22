import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Pencil, X, Plus, Save, Mail, Phone, MapPin, Building, Briefcase, Calendar, Download, Trash2, Camera, FileText, Upload, ExternalLink, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, refreshUser } = useAuth();
  const profileId = id ? parseInt(id) : user.id;
  const [profile, setProfile] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('private');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Skills & Certs state
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' });

  // Documents state
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', type: 'Identity Proof', file: null, file_url: '' });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Wage state
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
      setDocuments(data.documents || []);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
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
      if (profileId === user.id && refreshUser) refreshUser();
      setEditing(false);
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar image size must be less than 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar(profileId, formData);
      setProfile(prev => ({ ...prev, profile_picture: res.profile_picture }));
      if (profileId === user.id && refreshUser) {
        refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to upload profile picture');
    }
    setUploadingAvatar(false);
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

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docForm.name) {
      alert('Document name is required');
      return;
    }
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('name', docForm.name);
      formData.append('type', docForm.type);
      if (docForm.file) {
        formData.append('file', docForm.file);
      } else if (docForm.file_url) {
        formData.append('file_url', docForm.file_url);
      } else {
        alert('Please select a file or enter a document URL link');
        setUploadingDoc(false);
        return;
      }
      await api.addDocument(profileId, formData);
      setShowAddDoc(false);
      setDocForm({ name: '', type: 'Identity Proof', file: null, file_url: '' });
      await loadProfile();
    } catch (err) {
      alert(err.message || 'Failed to add document');
    }
    setUploadingDoc(false);
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    try {
      await api.deleteDocument(profileId, docId);
      await loadProfile();
    } catch (err) {
      alert(err.message);
    }
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
        {/* Profile Picture with Upload Camera Overlay */}
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 16px' }}>
          {profile.profile_picture ? (
            <img
              src={profile.profile_picture}
              alt={`${profile.first_name} ${profile.last_name}`}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
            />
          ) : (
            <div className="profile-avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
          )}
          {canEdit && (
            <label
              title="Change Profile Picture"
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 30,
                height: 30,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s'
              }}
            >
              <Camera size={15} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={uploadingAvatar} />
            </label>
          )}
        </div>

        <div className="profile-name">{profile.first_name} {profile.last_name}</div>
        <div className="profile-designation">{profile.designation}</div>
        <span className={`badge ${profile.role === 'admin' ? 'badge-admin' : 'badge-employee'}`}>{profile.role}</span>

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

      <div className="profile-content">
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'private' ? 'active' : ''}`} onClick={() => setActiveTab('private')}>Private Info</button>
          <button className={`profile-tab ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>Resume</button>
          <button className={`profile-tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
          {(isAdmin || user.id === profileId) && <button className={`profile-tab ${activeTab === 'salary' ? 'active' : ''}`} onClick={() => setActiveTab('salary')}>Salary Info</button>}
        </div>

        <div className="profile-main-card">
          {/* TAB 1: Personal & Bio */}
          {activeTab === 'private' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>About & Passions</h3>
                {canEdit && !editing && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> Edit Profile</button>
                )}
                {editing && (
                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}</button>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3>About {canEdit && <Pencil size={14} className="edit-icon" onClick={() => setEditing(true)} />}</h3>
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

              <div className="profile-section">
                <h3>What I love about my job {canEdit && <Pencil size={14} className="edit-icon" onClick={() => setEditing(true)} />}</h3>
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

              <div className="profile-section">
                <h3>My interests and hobbies {canEdit && <Pencil size={14} className="edit-icon" onClick={() => setEditing(true)} />}</h3>
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
                <>
                  <div className="profile-section">
                    <h3>Contact Information <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>(Editable by Employee)</span></h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="e.g. +91 98765 43210" />
                      </div>
                      <div className="form-group">
                        <label>Residential Address</label>
                        <input className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Full address" />
                      </div>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="profile-section" style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 16 }}>
                      <h3>Administrative & Job Details (Admin Only)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                          <label>First Name</label>
                          <input className="form-input" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Last Name</label>
                          <input className="form-input" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input className="form-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Department</label>
                          <input className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Designation</label>
                          <input className="form-input" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>Work Location</label>
                          <input className="form-input" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-section" style={{ background: 'rgba(124, 106, 255, 0.05)', padding: 14, borderRadius: 8, border: '1px solid rgba(124, 106, 255, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        <Lock size={14} style={{ color: 'var(--primary)' }} />
                        <span><strong>Job & Identity Details:</strong> First Name, Last Name, Email, Department, Designation, and Work Location are fixed by Company Admin/HR.</span>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr auto auto', gap: 8, marginTop: 12, alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Certificate Name</label>
                      <input className="form-input" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} placeholder="AWS Certified Solutions Architect" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Issuing Organization / Year</label>
                      <input className="form-input" value={newCert.issuer} onChange={e => setNewCert({...newCert, issuer: e.target.value})} placeholder="Amazon Web Services (2025)" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Date</label>
                      <input className="form-input" type="date" value={newCert.date} onChange={e => setNewCert({...newCert, date: e.target.value})} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleAddCert}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddCert(false)}><X size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: 18 }}>Employee Documents</h3>
                {canEdit && (
                  <button className="btn btn-primary btn-sm flex items-center gap-4" onClick={() => setShowAddDoc(true)}>
                    <Upload size={14} /> Upload Document
                  </button>
                )}
              </div>

              {showAddDoc && (
                <div className="profile-section mb-20" style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: 12, fontSize: 15 }}>Upload / Add Document</h4>
                  <form onSubmit={handleAddDocument}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Document Title</label>
                        <input className="form-input" placeholder="e.g. Passport Copy / NDA Contract" value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} required />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Category / Type</label>
                        <select className="form-select" value={docForm.type} onChange={e => setDocForm({ ...docForm, type: e.target.value })}>
                          <option>Identity Proof</option>
                          <option>Offer Letter</option>
                          <option>Employment Contract</option>
                          <option>Academic Certificate</option>
                          <option>Tax / Payroll Document</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label>Choose File OR File URL</label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input type="file" className="form-input" style={{ flex: 1 }} onChange={e => setDocForm({ ...docForm, file: e.target.files[0] })} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
                        <input type="text" className="form-input" style={{ flex: 1 }} placeholder="https://..." value={docForm.file_url} onChange={e => setDocForm({ ...docForm, file_url: e.target.value })} />
                      </div>
                    </div>

                    <div className="flex gap-8">
                      <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingDoc}>
                        {uploadingDoc ? 'Uploading...' : 'Save Document'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddDoc(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="documents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {documents.map((doc) => (
                  <div key={doc.id} className="doc-card" style={{ background: 'var(--surface-hover)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <FileText size={22} style={{ color: 'var(--primary)' }} />
                        <span className="badge" style={{ fontSize: 10, background: 'rgba(124, 106, 255, 0.1)', color: 'var(--primary)' }}>{doc.type}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} /> View Document
                      </a>
                      {canEdit && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDoc(doc.id)} style={{ padding: '4px 8px' }} title="Delete Document">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {documents.length === 0 && !showAddDoc && (
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                  <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                  <h4>No documents uploaded yet</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Store employee contracts, identity proofs, and certificates securely.</p>
                  {canEdit && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddDoc(true)}>
                      <Upload size={14} /> Upload First Document
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

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
