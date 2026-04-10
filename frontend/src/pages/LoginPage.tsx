import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { authService } from '../services/auth';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
    const response = await authAPI.login(email, password);  // ✅ use authAPI
    authService.setToken(response.data.token);               // ✅ set token
    authService.setUser(response.data.user);                 // ✅ set user
    navigate('/dashboard');
  } catch (err: any) {
    setError(err?.response?.data?.error || 'Invalid email or password.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-split">
      {/* ── Left brand panel ─────────────────────────── */}
      <div className="auth-split__brand">
        <div className="auth-split__brand-inner">
          <div className="auth-brand__logo">
            <span className="auth-brand__mark">T</span>
            <span className="auth-brand__name">Taskr</span>
          </div>
          <h2 className="auth-brand__headline">
            Everything your team needs to ship, on time.
          </h2>
          <p className="auth-brand__sub">
            Organize work, track progress, and stay aligned — all in one clean workspace.
          </p>
          <div className="auth-brand__dots">
            <span /><span /><span />
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="auth-split__form-side">
        <div className="auth-form-wrap">
          <div className="auth-form__header">
            <h1 className="auth-form__title">Welcome back</h1>
            <p className="auth-form__sub">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="auth-form__error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <span className="auth-submit__spinner" />
                : 'Sign in'}
            </button>
          </form>

          <p className="auth-form__footer">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-form__link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;