import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Upload, Building, User, Mail, Phone, Lock, Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';

export default function RegisterPage() {
  const { registerCompany } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // State fields
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('company_name', companyName);
    formData.append('admin_first_name', firstName);
    formData.append('admin_last_name', lastName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      await registerCompany(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Top Floating Theme Toggle */}
      <div style={{ position: 'fixed', top: 24, right: 28, zIndex: 50 }}>
        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="auth-container" style={{ maxWidth: '540px' }}>
        <div className="auth-logo">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 'var(--radius)', background: 'var(--brand-gradient)', boxShadow: '0 0 24px -2px rgba(99, 102, 241, 0.6)', marginBottom: 14 }}>
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1>Dayflow</h1>
          <p>Every workday, perfectly aligned</p>
        </div>

        <div className="auth-card">
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Register Your Company</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 24 }}>
            Initialize a multi-tenant workspace with your custom brand and HR Admin account.
          </p>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: 'var(--radius)', color: 'var(--accent-red-light)', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Logo Upload */}
            <div className="form-group">
              <label>Company Brand Logo (Optional)</label>
              <div style={{ border: '1px dashed var(--border)', background: 'var(--bg-input)', borderRadius: 'var(--radius)', padding: 16, textAlign: 'center' }}>
                {logoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={logoPreview} alt="Logo" style={{ maxHeight: 36, maxWidth: 100, objectFit: 'contain' }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{logoFile?.name}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Upload size={22} color="var(--primary-light)" />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Upload brand logo (PNG, JPG, SVG - max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Acme Technologies Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Admin First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Priya"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Admin Work Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="priya@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password (min 8 chars) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 12 }}
            >
              {loading ? 'Setting Up Workspace...' : 'Launch Company Workspace'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In Instead →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
