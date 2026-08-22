import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification state variables
  const [verifyingEmail, setVerifyingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDemoCode, setOtpDemoCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.data && err.data.needs_verification) {
        setVerifyingEmail(err.data.email);
        setOtpDemoCode(err.data.code);
      } else {
        setError(err.message || 'Invalid credentials');
      }
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
              Your account is registered but email verification is required.
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
      <div className="auth-container">
        <div className="auth-logo">
          <h1>Dayflow</h1>
          <p>Every workday, perfectly aligned</p>
        </div>
        <div className="auth-card">
          <h2>Sign In</h2>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Login ID / Email</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your email or employee ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                id="login-email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="form-input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="login-password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="login-submit">
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
        </div>
        <div className="auth-footer" style={{ textAlign: 'center', marginTop: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              Register Company
            </Link>
          </p>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Demo Admin: priya.sharma@dayflow.com / Admin@123
          </p>
        </div>
      </div>
    </div>
  );
}
