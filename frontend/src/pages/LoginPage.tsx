import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 🆕 Redux Imports
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/slices/authSlice';
import './LoginPage.css';

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // 🆕 Initialize dispatch

  // Keep form inputs in local state (Best Practice)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🆕 Pull loading status and network errors directly from Redux global state
  const { status, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return; // Basic validation

    try {
      // 🆕 Dispatch the thunk and use .unwrap() to handle the promise result locally
      await dispatch(login({ email, password })).unwrap();
      navigate('/');
    } catch (err) {
      // Intentionally left blank. 
      // The thunk handles the error and puts it in the Redux state, 
      // which automatically triggers a re-render to display it below.
    }
  };

  return (
    <div className="auth-hero">
      {/* Dynamic background shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <div className="auth-container">
        <div className="auth-content">
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
            <h1>Manage your work <br /><span className="text-gradient">without the chaos.</span></h1>
            <p>The all-in-one workspace for elite teams to track tasks, measure productivity, and hit deadlines.</p>
            
            <ul className="feature-list">
              <li><IconCheck /> Task tracking & prioritisation</li>
              <li><IconCheck /> Analytics & productivity insights</li>
              <li><IconCheck /> Team-ready from day one</li>
            </ul>
          </div>

          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Welcome back</h2>
              <p>Enter your details to access your workspace</p>
            </div>

            {/* 🆕 Render the error string directly from Redux state */}
            {error && <div className="auth__error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email address</label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <div className="label-row">
                  <label>Password</label>
                  <a href="#" className="forgot-link">Forgot?</a>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {/* 🆕 Disable button and change text based on Redux status */}
              <button type="submit" className="btn-auth-submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Signing in...' : 'Sign in to Workspace'}
              </button>
            </form>

            <div className="auth-card-footer">
              <p>New to TaskPilot? <Link to="/signup">Create a free account</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;