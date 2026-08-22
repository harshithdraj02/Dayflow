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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
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
