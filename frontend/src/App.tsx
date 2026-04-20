import React, { useEffect, useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { authService } from './services/auth';
import { workspaceAPI } from './services/api';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import './App.css';

/* ── Icons ─────────────────────────────────────────────────── */
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ── Logo mark ─────────────────────────────────────────────── */
const LogoMark = () => (
  <div className="logo-mark">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
    </svg>
  </div>
);

/* ── Workspace Selector ─────────────────────────────────────── */
const WorkspaceSelector: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const { workspaceId, workspaces, currentWorkspace, setWorkspaceId, refreshWorkspaces, refreshMembers } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'invite'>('list');
  const [newName, setNewName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, left: rect.left });
    }
    setView('list');
    setFeedback('');
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await workspaceAPI.create(newName.trim());
      await refreshWorkspaces();
      setWorkspaceId(res.data.id);
      setNewName('');
      setView('list');
    } catch {
      setFeedback('Failed to create workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !workspaceId) return;
    setSaving(true);
    setFeedback('');
    try {
      await workspaceAPI.invite(workspaceId, inviteEmail.trim(), inviteRole);
      await refreshMembers();
      setInviteEmail('');
      setFeedback('Invitation sent!');
      setTimeout(() => { setFeedback(''); setView('list'); }, 1500);
    } catch (err: any) {
      setFeedback(err?.response?.data?.error || 'Failed to send invite.');
    } finally {
      setSaving(false);
    }
  };

  if (collapsed) {
    return (
      <div className="sidebar__workspace sidebar__workspace--collapsed">
        <button
          ref={btnRef}
          className="sidebar__ws-icon-only"
          onClick={openDropdown}
          title={currentWorkspace?.name || 'Select workspace'}
        >
          <span className="sidebar__ws-icon">
            {currentWorkspace ? initials(currentWorkspace.name) : '?'}
          </span>
        </button>
        {open && (
          <WorkspaceDropdown
            ref={dropRef}
            pos={dropPos}
            view={view}
            setView={setView}
            workspaces={workspaces}
            workspaceId={workspaceId}
            setWorkspaceId={(id) => { setWorkspaceId(id); setOpen(false); }}
            newName={newName}
            setNewName={setNewName}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            saving={saving}
            feedback={feedback}
            onCreate={handleCreate}
            onInvite={handleInvite}
            initials={initials}
          />
        )}
      </div>
    );
  }

  return (
    <div className="sidebar__workspace">
      <button ref={btnRef} className="sidebar__ws-btn" onClick={openDropdown}>
        <span className="sidebar__ws-icon">
          {currentWorkspace ? initials(currentWorkspace.name) : '?'}
        </span>
        <span className="sidebar__ws-name">{currentWorkspace?.name || 'Select workspace'}</span>
        <span className="sidebar__ws-chevron"><IconChevronDown /></span>
      </button>

      {open && (
        <WorkspaceDropdown
          ref={dropRef}
          pos={dropPos}
          view={view}
          setView={setView}
          workspaces={workspaces}
          workspaceId={workspaceId}
          setWorkspaceId={(id) => { setWorkspaceId(id); setOpen(false); }}
          newName={newName}
          setNewName={setNewName}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          saving={saving}
          feedback={feedback}
          onCreate={handleCreate}
          onInvite={handleInvite}
          initials={initials}
        />
      )}
    </div>
  );
};

/* ── Workspace Dropdown (portal-positioned) ─────────────────── */
interface DropdownProps {
  pos: { top: number; left: number };
  view: 'list' | 'create' | 'invite';
  setView: (v: 'list' | 'create' | 'invite') => void;
  workspaces: ReturnType<typeof useWorkspace>['workspaces'];
  workspaceId: string | null;
  setWorkspaceId: (id: string) => void;
  newName: string;
  setNewName: (v: string) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: 'member' | 'admin';
  setInviteRole: (v: 'member' | 'admin') => void;
  saving: boolean;
  feedback: string;
  onCreate: () => void;
  onInvite: () => void;
  initials: (name: string) => string;
}

const WorkspaceDropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ pos, view, setView, workspaces, workspaceId, setWorkspaceId, newName, setNewName,
    inviteEmail, setInviteEmail, inviteRole, setInviteRole, saving, feedback, onCreate, onInvite, initials }, ref) => (
    <div
      ref={ref}
      className="ws-dropdown"
      style={{ top: pos.top, left: pos.left }}
    >
      {view === 'list' && (
        <>
          <div className="ws-dropdown__header">Workspaces</div>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              className={`ws-dropdown__item${ws.id === workspaceId ? ' ws-dropdown__item--active' : ''}`}
              onClick={() => setWorkspaceId(ws.id)}
            >
              <span className="sidebar__ws-icon" style={{ fontSize: 9 }}>{initials(ws.name)}</span>
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ws.name}
              </span>
              {ws.id === workspaceId && <IconCheck />}
            </button>
          ))}
          <div className="ws-dropdown__divider" />
          <button className="ws-dropdown__item ws-dropdown__item--action" onClick={() => setView('invite')}>
            <IconUsers /> Invite member
          </button>
          <button className="ws-dropdown__item ws-dropdown__item--action ws-dropdown__item--create" onClick={() => setView('create')}>
            <IconPlus /> New workspace
          </button>
        </>
      )}

      {view === 'create' && (
        <>
          <div className="ws-dropdown__header">New Workspace</div>
          <div className="ws-dropdown__form">
            <input
              className="ws-dropdown__input"
              placeholder="Workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
              autoFocus
            />
            {feedback && <p className="ws-dropdown__feedback ws-dropdown__feedback--error">{feedback}</p>}
            <div className="ws-dropdown__form-row">
              <button className="ws-dropdown__item ws-dropdown__item--ghost" onClick={() => setView('list')}>Cancel</button>
              <button className="ws-dropdown__item ws-dropdown__item--primary" onClick={onCreate} disabled={saving || !newName.trim()}>
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </>
      )}

      {view === 'invite' && (
        <>
          <div className="ws-dropdown__header">Invite to Workspace</div>
          <div className="ws-dropdown__form">
            <input
              className="ws-dropdown__input"
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onInvite()}
              autoFocus
            />
            <select
              className="ws-dropdown__input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            {feedback && (
              <p className={`ws-dropdown__feedback${feedback === 'Invitation sent!' ? '' : ' ws-dropdown__feedback--error'}`}>
                {feedback}
              </p>
            )}
            <div className="ws-dropdown__form-row">
              <button className="ws-dropdown__item ws-dropdown__item--ghost" onClick={() => setView('list')}>Cancel</button>
              <button className="ws-dropdown__item ws-dropdown__item--primary" onClick={onInvite} disabled={saving || !inviteEmail.trim()}>
                {saving ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
);

/* ── Protected route ───────────────────────────────────────── */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/* ── Sidebar ───────────────────────────────────────────────── */
const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void; onNavClick?: () => void }> = ({ collapsed, onToggle, onNavClick }) => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const initials = user?.email ? user.email[0].toUpperCase() : 'U';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <IconGrid /> },
    { to: '/analytics', label: 'Analytics',  icon: <IconChart /> },
  ];

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <LogoMark />
          {!collapsed && <span className="sidebar__brand-name">TaskPilot</span>}
        </div>
        <button className="sidebar__toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <IconMenu /> : <IconX />}
        </button>
      </div>

      {/* Workspace Selector */}
      <WorkspaceSelector collapsed={collapsed} />

      {/* Nav */}
      <nav className="sidebar__nav">
        {!collapsed && <span className="sidebar__section-label">Navigation</span>}
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <span className="sidebar__link-icon">{icon}</span>
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-email">{user?.email || 'My Account'}</span>
              <span className="sidebar__user-role">Member</span>
            </div>
          )}
        </div>
        <button
          className="sidebar__logout"
          onClick={() => { authService.logout(); navigate('/login'); }}
          title="Sign out"
        >
          <IconLogout />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

/* ── App shell ─────────────────────────────────────────────── */
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = () => window.innerWidth < 768;

  const handleToggle = () => {
    if (isMobile()) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`shell${collapsed && !mobileOpen ? ' shell--collapsed' : ''}`}>
      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}
      <Sidebar
        collapsed={collapsed && !mobileOpen}
        onToggle={handleToggle}
        onNavClick={() => { if (isMobile()) setMobileOpen(false); }}
      />
      <main className="shell__main">
        <div className="shell__content">{children}</div>
      </main>
    </div>
  );
};

/* ── Root ──────────────────────────────────────────────────── */
export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    const sync = () => setIsAuthenticated(authService.isAuthenticated());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return (
    <Router>
      <WorkspaceProvider>
        <Routes>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>
          }/>
          <Route path="/analytics" element={
            <ProtectedRoute><AppShell><AnalyticsPage /></AppShell></ProtectedRoute>
          }/>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WorkspaceProvider>
    </Router>
  );
};

export default App;
