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

  // Email verification state variables
  const [verifyingEmail, setVerifyingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDemoCode, setOtpDemoCode] = useState('');
  const [verifying, setVerifying] = useState(false);

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

    // Password complexity check: 8+ chars, upper, lower, digit, symbol
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @$!%*?&).');
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
      const res = await registerCompany(formData);
      if (res && res.verification_required) {
        setVerifyingEmail(res.email);
        setOtpDemoCode(res.code);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyingEmail, code: otpCode })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      localStorage.setItem('dayflow_token', data.token);
      localStorage.setItem('dayflow_user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    }
    setVerifying(false);
  };

  if (verifyingEmail) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '440px' }}>
          <div className="auth-logo">
            <h1>Dayflow</h1>
            <p>Every workday, perfectly aligned</p>
          </div>
          <div className="auth-card">
            <h2>Verify Your Email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              We have generated a mock verification code for <strong>{verifyingEmail}</strong>.
            </p>

            {otpDemoCode && (
              <div style={{
                background: 'rgba(124, 106, 255, 0.1)',
                border: '1px dashed var(--primary)',
                color: 'var(--primary)',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 20,
                textAlign: 'center',
                fontWeight: 600
              }}>
                📧 Demo OTP Code Sent: <span style={{ fontSize: 16, letterSpacing: 2, color: 'var(--accent-green)' }}>{otpDemoCode}</span>
              </div>
            )}

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="required-label">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6, fontWeight: 700 }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={verifying}
                style={{ marginTop: 24 }}
              >
                {verifying ? 'Verifying email...' : 'VERIFY & ENTER DASHBOARD'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
