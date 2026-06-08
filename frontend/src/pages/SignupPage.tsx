import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { authService } from '../services/auth';
import './LoginPage.css'; // Reusing our new modern CSS file

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) { 
      setError('Please fill in all fields.'); 
      return; 
    }
    if (password.length < 6) { 
      setError('Password must be at least 6 characters.'); 
      return; 
    }

    try {
      setLoading(true);
      // Calls your register API endpoint
      const res = await authAPI.signup(email, password); 
      authService.setToken(res.data.token);
      authService.setUser(res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create account. Email might already be in use.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="auth-hero">
      {/* Dynamic background shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <div className="auth-container">
        <div className="auth-content">
          
          {/* Left Branding Side (Updated with your Signup copy) */}
          <div className="brand-section">
            <div className="logo-pill">
              <div className="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
                </svg>
              </div>
              <span>TaskPilot</span>
            </div>
            <h1>Start organised, <br /><span className="text-gradient">stay organised.</span></h1>
            <p>Create your free workspace in seconds. No credit card needed. Start tracking what matters.</p>
            
            <ul className="feature-list">
              <li><IconCheck /> Free forever — no credit card needed</li>
              <li><IconCheck /> Up and running in under 2 minutes</li>
              <li><IconCheck /> Full analytics from day one</li>
            </ul>
          </div>

          {/* Right Auth Card Side */}
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Create your account</h2>
              <p>Free forever. No credit card required.</p>
            </div>

            {error && <div className="auth__error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email address</label>
                <input 
                  type="email" 
                  placeholder="you@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <div className="label-row">
                  <label>Password</label>
                </div>
                <input 
                  type="password" 
                  placeholder="Min. 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn-auth-submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="auth-card-footer">
              <p>Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SignupPage;