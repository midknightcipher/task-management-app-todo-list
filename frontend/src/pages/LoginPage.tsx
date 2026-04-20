import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { authService } from '../services/auth';
import { useWorkspace } from '../context/WorkspaceContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshWorkspaces } = useWorkspace();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    try {
      setLoading(true);
      const res = await authAPI.login(email, password);
      authService.setToken(res.data.token);
      authService.setUser(res.data.user);
      // Eagerly load workspaces so the dashboard shows immediately
      await refreshWorkspaces();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      {/* Left panel */}
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
            <h2 className="auth__brand-headline">Your work,<br />beautifully organised.</h2>
            <p className="auth__brand-sub">Track tasks, measure progress, and stay on top of everything — all in one focused workspace.</p>
          </div>

          <div className="auth__features">
            {[
              'Task tracking & prioritisation',
              'Analytics & productivity insights',
              'Team-ready from day one',
            ].map(f => (
              <div key={f} className="auth__feature">
                <span className="auth__feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth__form-side">
        <div className="auth__form-wrap">
          <div className="auth__form-head">
            <h1 className="auth__form-title">Welcome back</h1>
            <p className="auth__form-sub">Sign in to your TaskPilot workspace</p>
          </div>

          {error && <div className="auth__error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth__form">
            <div className="auth__field">
              <label className="auth__label">Email address</label>
              <input
                className="auth__input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="auth__field">
              <div className="auth__label-row">
                <label className="auth__label">Password</label>
                <a href="#" className="auth__link-sm">Forgot password?</a>
              </div>
              <input
                className="auth__input"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? <><span className="auth__spinner" />Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="auth__footer">
            Don't have an account?{' '}
            <Link to="/signup" className="auth__link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
