import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import './AppLayout.css';

/* ─────────────────────────── Icons ─────────────────────────── */
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconFolders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const LogoMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
  </svg>
);

/* ─────────────────────── AppLayout Props ────────────────────── */
interface AppLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

/* ──────────────────────── Component ────────────────────────── */
const AppLayout: React.FC<AppLayoutProps> = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const displayName  = user?.name  || user?.email?.split('@')[0] || 'User';
  const avatarLetter = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
      navigate('/');
    }
  };

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav__inner">
          <div className="app-nav__left">
            <div 
              className="app-nav__brand" 
              onClick={() => navigate('/dashboard')}
              role="button"
            >
              <div className="app-nav__brand-icon">
                <LogoMark />
              </div>
              <span className="app-nav__brand-name">TaskPilot</span>
            </div>

            <nav className="app-nav__links" aria-label="Main navigation">
              <NavLink to="/dashboard" className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}>
                <IconGrid /> Dashboard
              </NavLink>
              <NavLink to="/projects" className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}>
                <IconFolders /> Projects
              </NavLink>
              <NavLink to="/all-tasks" className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}>
                <IconCheck /> All Tasks
              </NavLink>
              <NavLink to="/my-tasks" className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}>
                <IconUser /> My Tasks
              </NavLink>
              <NavLink to="/team" className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}>
                <IconUsers /> Team
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}>
                <IconChart /> Analytics
              </NavLink>
            </nav>
          </div>

          <div className="app-nav__right">
            <div className="app-nav__user">
              <div className="app-nav__user-text">
                <span className="app-nav__user-name">{displayName}</span>
                <span className="app-nav__user-plan">Free plan</span>
              </div>
              <div className="app-nav__avatar" aria-hidden="true">{avatarLetter}</div>
            </div>
            <div className="app-nav__divider"></div>
            <button className="app-nav__logout" onClick={handleLogout} title="Sign out">
              <IconLogout />
            </button>
          </div>
        </div>
      </header>

      <main className="app-body">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;