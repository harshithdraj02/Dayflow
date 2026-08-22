import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Upload, Building, User, Mail, Phone, Lock } from 'lucide-react';

export default function RegisterPage() {
  const { registerCompany } = useAuth();
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
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      setError('');
      // Generate object URL for preview
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

    // Prepare Multipart Form Data
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
      <div className="auth-container" style={{ maxWidth: '520px' }}>
        <div className="auth-logo">
          <h1>Dayflow</h1>
          <p>Every workday, perfectly aligned</p>
        </div>
        <div className="auth-card">
          <h2>Register Company Admin</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
            Create a workspace for your company and initialize your Administrator account.
          </p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Logo Upload Section */}
            <div className="form-group">
              <label>Company Logo</label>
              <div className="logo-upload-box">
                {logoPreview ? (
                  <div className="logo-preview-container">
                    <img src={logoPreview} alt="Logo preview" className="logo-upload-preview" />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="logo-placeholder-label">
                    <Upload size={24} className="upload-icon" />
                    <span>Upload Logo (optional, max 5MB)</span>
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

            {/* Company Info */}
            <div className="form-group">
              <label className="required-label">Company Name</label>
              <div className="form-input-with-icon">
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <Building size={16} className="input-field-icon" />
              </div>
            </div>

            {/* Personal Details */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="required-label">Admin First Name</label>
                <div className="form-input-with-icon">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <User size={16} className="input-field-icon" />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="required-label">Admin Last Name</label>
                <div className="form-input-with-icon">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <User size={16} className="input-field-icon" />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="form-group">
              <label className="required-label">Admin Email Address</label>
              <div className="form-input-with-icon">
                <input
                  type="email"
                  className="form-input"
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} className="input-field-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number (optional)</label>
              <div className="form-input-with-icon">
                <input
                  type="tel"
                  autoComplete="new-phone"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Phone size={16} className="input-field-icon" />
              </div>
            </div>

            {/* Passwords */}
            <div className="form-group">
              <label className="required-label">Password</label>
              <div className="form-input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} className="input-field-icon" />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="required-label">Confirm Password</label>
              <div className="form-input-with-icon">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Verify password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Lock size={16} className="input-field-icon" />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 24 }}
            >
              {loading ? 'Initializing company...' : 'REGISTER & GET STARTED'}
            </button>
          </form>
        </div>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: 'var(--text-muted)' }}>
            Already have an Account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
