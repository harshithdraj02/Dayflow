import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email or employee ID and password'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  const quickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="auth-page">
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
