import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, Sparkles, Lock, Mail, ArrowRight, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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
    if (!email || !password) { setError('Please enter your email or employee ID and password'); return; }
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

      <div className="auth-container">
        {/* Brand Header */}
        <div className="auth-logo">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 'var(--radius)', background: 'var(--brand-gradient)', boxShadow: '0 0 24px -2px rgba(99, 102, 241, 0.6)', marginBottom: 14 }}>
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1>Dayflow</h1>
          <p>Every workday, perfectly aligned</p>
        </div>

        <div className="auth-card">
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 24 }}>
            Enter your employee credentials to access your workspace.
          </p>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: 'var(--radius)', color: 'var(--accent-red-light)', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Work Email or Employee ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="priya.sharma@dayflow.com or ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                id="login-email"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ margin: 0 }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="login-password"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full btn-lg" 
              disabled={loading} 
              id="login-submit"
              style={{ marginTop: 10 }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick-fill Demo Credential Chips */}
          <div className="auth-demo-chips">
            <div className="auth-demo-title">⚡ Instant Demo Accounts</div>
            <div className="demo-chip-row">
              <button 
                type="button"
                className="demo-chip" 
                onClick={() => quickFill('priya.sharma@dayflow.com', 'Admin@123')}
              >
                👑 HR Admin (Priya)
              </button>
              <button 
                type="button"
                className="demo-chip" 
                onClick={() => quickFill('arjun.patel@dayflow.com', 'Employee@123')}
              >
                💻 Senior Dev (Arjun)
              </button>
            </div>
            <div className="demo-chip-row" style={{ marginTop: 8 }}>
              <button 
                type="button"
                className="demo-chip" 
                onClick={() => quickFill('charan.reddy@dayflow.com', 'Employee@123')}
              >
                🚀 Engineer (Charan)
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
            New organization?{' '}
            <Link to="/register-company" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>
              Register Your Company →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
