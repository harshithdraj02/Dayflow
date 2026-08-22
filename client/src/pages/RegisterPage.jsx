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
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
      await registerCompany(formData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    }
    setLoading(false);
  };

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
