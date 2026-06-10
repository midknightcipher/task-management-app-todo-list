import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api';
import { authService } from '../../services/auth';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  anchorRef?: React.RefObject<HTMLElement>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  anchorRef,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const panelRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { status, error: reduxError } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMode(initialMode);
    setLocalError('');
    setEmail('');
    setPassword('');
  }, [initialMode, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        anchorRef?.current && !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'login') {
      try {
        await dispatch(login({ email, password })).unwrap();
        onClose();
        navigate('/dashboard');
      } catch {
        // Redux handles error state
      }
    } else {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      try {
        setIsSigningUp(true);
        const res = await authAPI.signup(email, password);
        authService.setToken(res.data.token);
        authService.setUser(res.data.user);
        window.location.href = '/dashboard';
      } catch (err: any) {
        setLocalError(err?.response?.data?.error || 'Failed to create account.');
        setIsSigningUp(false);
      }
    }
  };

  const isLoading = status === 'loading' || isSigningUp;
  const displayError = mode === 'login' ? reduxError : localError;

  return (
    <div className="auth-dropdown-panel" ref={panelRef} role="dialog" aria-modal="true">
      <div className="auth-dropdown-arrow" />

      <div className="auth-dropdown-header">
        <div>
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === 'login'
              ? 'Enter your details to access your workspace.'
              : 'Free forever. No credit card required.'}
          </p>
        </div>
        <button onClick={onClose} className="auth-modal-close" aria-label="Close">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {displayError && (
        <div className="auth-modal-error">{displayError}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-modal-form">
        <div className="auth-modal-group">
          <label className="auth-modal-label">Email address</label>
          <input
            type="email"
            className="auth-modal-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            autoFocus
          />
        </div>
        <div className="auth-modal-group">
          <div className="auth-modal-label-row">
            <label className="auth-modal-label">Password</label>
            {mode === 'login' && (
              <a href="#" className="auth-modal-link">Forgot?</a>
            )}
          </div>
          <input
            type="password"
            className="auth-modal-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={mode === 'signup' ? 6 : undefined}
          />
        </div>
        <button type="submit" className="auth-modal-submit" disabled={isLoading}>
          {isLoading
            ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
            : (mode === 'login' ? 'Sign in to Workspace' : 'Create account')}
        </button>
      </form>

      <div className="auth-modal-footer">
        <button
          type="button"
          className="auth-modal-footer-text"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setLocalError(''); }}
        >
          {mode === 'login' ? 'New to TaskPilot? ' : 'Already have an account? '}
          <span>{mode === 'login' ? 'Create a free account' : 'Sign in instead'}</span>
        </button>
      </div>
    </div>
  );
};