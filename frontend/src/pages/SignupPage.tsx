import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { authService } from '../services/auth';
import './LoginPage.css';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    try {
      setLoading(true);
      const res = await authAPI.signup(email, password);
      authService.setToken(res.data.token);
      authService.setUser(res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth">
      <div className="auth__brand">
        <div className="auth__brand-inner">
          <div className="auth__logo">
            <div className="auth__logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
              </svg>
            </div>
            <span className="auth__logo-name">TaskPilot</span>
          </div>
          <div className="auth__brand-copy">
            <h2 className="auth__brand-headline">Start organised,<br />stay organised.</h2>
            <p className="auth__brand-sub">Create your free workspace in seconds. No credit card needed. Start tracking what matters.</p>
          </div>
          <div className="auth__features">
            {['Free forever — no credit card needed', 'Up and running in under 2 minutes', 'Full analytics from day one'].map(f => (
              <div key={f} className="auth__feature"><span className="auth__feature-dot" /><span>{f}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth__form-side">
        <div className="auth__form-wrap">
          <div className="auth__form-head">
            <h1 className="auth__form-title">Create your account</h1>
            <p className="auth__form-sub">Free forever. No credit card required.</p>
          </div>

          {error && <div className="auth__error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth__form">
            <div className="auth__field">
              <label className="auth__label">Email address</label>
              <input className="auth__input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="auth__field">
              <label className="auth__label">Password</label>
              <input className="auth__input" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required minLength={6} />
            </div>
            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? <><span className="auth__spinner" />Creating account…</> : 'Create account'}
            </button>
          </form>

          <p className="auth__footer">
            Already have an account? <Link to="/login" className="auth__link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
