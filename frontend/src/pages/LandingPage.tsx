import React, { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { AuthModal } from '../components/Auth/AuthModal';
import './LandingPage.css';

/* ─────────────────────────── Icons ─────────────────────────── */
const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0ea5e9" />
    <path d="M2 17l10 5 10-5" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M2 12l10 5 10-5" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconFolder = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

/* ─────────────── Marketing Landing Page ─────────────── */
const MarketingPage: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Ref on the nav-links wrapper so the dropdown anchors to it
  const navLinksRef = useRef<HTMLDivElement>(null);

  const openAuth = (mode: 'login' | 'signup') => {
    // Toggle: clicking same button again closes the panel
    if (isAuthModalOpen && authMode === mode) {
      setIsAuthModalOpen(false);
      return;
    }
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="landing-container">
      <div className="hero-glow"></div>

      <nav className="landing-nav">
        <div className="landing-brand">
          <LogoIcon />
          <span className="brand-text">TaskPilot</span>
        </div>

        {/* position: relative so the dropdown is anchored here */}
        <div className="landing-nav-links" ref={navLinksRef} style={{ position: 'relative' }}>
          <button onClick={() => openAuth('login')} className="btn-secondary">Log in</button>
          <button onClick={() => openAuth('signup')} className="btn-primary">Get Started</button>

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authMode}
            anchorRef={navLinksRef}
          />
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            TaskPilot is live
          </div>
          <h1 className="hero-title">
            Manage your work<br />
            <span className="text-gradient">without the chaos.</span>
          </h1>
          <p className="hero-subtitle">
            The all-in-one workspace for elite teams to track tasks, measure productivity,
            and hit deadlines — fully synced in real-time.
          </p>
          <div className="hero-actions">
            <button onClick={() => openAuth('signup')} className="btn-primary btn-large">
              Start for free <IconArrowRight />
            </button>
            <button onClick={() => openAuth('login')} className="btn-outline">
              Sign in to workspace
            </button>
          </div>
        </div>
        
        <div className="hero-image-wrapper">
          <div className="dashboard-mockup">
            <div className="mockup-top-nav">
              <div className="mockup-logo-area">
                <div className="mockup-logo-box">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/></svg>
                </div>
                TaskPilot
              </div>
              <div className="mockup-nav-links">
                <div className="mockup-nav-item active">Dashboard</div>
                <div className="mockup-nav-item">Projects</div>
                <div className="mockup-nav-item">All Tasks</div>
              </div>
              <div className="mockup-user-circle">A</div>
            </div>

            <div className="mockup-body">
              <div className="mockup-header-row">
                <div>
                  <div className="mockup-greeting-title">Welcome back, ankit1122 👋</div>
                  <div className="mockup-greeting-sub">Here's what's happening with your work today.</div>
                </div>
                <div className="mockup-btn">+ Create Task</div>
              </div>

              <div className="mockup-stats-row">
                <div className="mockup-stat-card">
                  <div className="mockup-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div className="mockup-stat-content">
                    <div className="mockup-stat-num">6</div>
                    <div className="mockup-stat-label">Total Tasks</div>
                  </div>
                </div>
                <div className="mockup-stat-card">
                  <div className="mockup-stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div className="mockup-stat-content">
                    <div className="mockup-stat-num">2</div>
                    <div className="mockup-stat-label">To Do</div>
                  </div>
                </div>
                <div className="mockup-stat-card">
                  <div className="mockup-stat-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  </div>
                  <div className="mockup-stat-content">
                    <div className="mockup-stat-num">3</div>
                    <div className="mockup-stat-label">In Progress</div>
                  </div>
                </div>
                <div className="mockup-stat-card">
                  <div className="mockup-stat-icon" style={{ background: '#dcfce3', color: '#16a34a' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div className="mockup-stat-content">
                    <div className="mockup-stat-num">1</div>
                    <div className="mockup-stat-label">Completed</div>
                  </div>
                </div>
              </div>

              <div className="mockup-content-row">
                <div className="mockup-projects">
                  <div className="mockup-section-title">Projects</div>
                  <div className="mockup-project-card">
                    <div className="mockup-project-left">
                      <div className="mockup-project-icon"><IconFolder /></div>
                      <div>
                        <div className="mockup-project-name">Task Manager Frontend</div>
                        <div className="mockup-project-role">Owner</div>
                      </div>
                    </div>
                    <div className="mockup-project-role">0 tasks</div>
                  </div>
                  <div className="mockup-project-card">
                    <div className="mockup-project-left">
                      <div className="mockup-project-icon"><IconFolder /></div>
                      <div>
                        <div className="mockup-project-name">Task Manager Backend</div>
                        <div className="mockup-project-role">Member</div>
                      </div>
                    </div>
                    <div className="mockup-project-role">3 tasks</div>
                  </div>
                </div>

                <div className="mockup-activity">
                  <div className="mockup-section-title">Recent Activity</div>
                  <div className="mockup-activity-item">
                    <div className="mockup-activity-left">
                      <div className="mockup-activity-dot" style={{background: '#16a34a'}}></div>
                      Play Hockey
                    </div>
                    <div className="mockup-badge-green">Completed</div>
                  </div>
                  <div className="mockup-activity-item" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px'}}>
                    <div className="mockup-activity-left">
                      <div className="mockup-activity-dot" style={{background: '#0ea5e9'}}></div>
                      Read a Research Paper
                    </div>
                    <div className="mockup-badge-blue">In-Progress</div>
                  </div>
                  <div className="mockup-activity-item" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px'}}>
                    <div className="mockup-activity-left">
                      <div className="mockup-activity-dot" style={{background: '#0ea5e9'}}></div>
                      Interview Prep
                    </div>
                    <div className="mockup-badge-blue">In-Progress</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Proof Bar ── */}
      <section className="proof-bar">
        <div className="proof-bar-inner">
          <div className="proof-item">
            <span className="proof-num">6</span>
            <span className="proof-label">task views — list, board,<br/>table, calendar and more</span>
          </div>
          <div className="proof-divider" />
          <div className="proof-item">
            <span className="proof-num">3</span>
            <span className="proof-label">role levels per project —<br/>Owner, Member, or Guest</span>
          </div>
          <div className="proof-divider" />
          <div className="proof-item">
            <span className="proof-num">1</span>
            <span className="proof-label">Prod Score — your daily<br/>productivity calculated live</span>
          </div>
          <div className="proof-divider" />
          <div className="proof-item">
            <span className="proof-num">∞</span>
            <span className="proof-label">projects and tasks —<br/>no plan limits</span>
          </div>
        </div>
      </section>

      {/* ── Feature: Dashboard ── */}
      <section className="feat-section">
        <div className="feat-row">
          <div className="feat-text">
            <span className="feat-tag">Dashboard</span>
            <h2>Your whole day,<br/>at a glance</h2>
            <p>The moment you log in, you see exactly where things stand — how many tasks are due, what's in progress, what's done. No digging through projects, no guessing what to pick up next.</p>
            <ul className="feat-list">
              <li><IconCheck /> Live task counts by status</li>
              <li><IconCheck /> Per-project progress bars</li>
              <li><IconCheck /> Recent activity feed</li>
            </ul>
          </div>
          <div className="feat-visual feat-visual--dashboard">
            <div className="fv-card">
              <div className="fv-greeting">Welcome back 👋</div>
              <div className="fv-stat-row">
                <div className="fv-stat" style={{background:'#fef3c7'}}>
                  <span className="fv-stat-n" style={{color:'#d97706'}}>6</span>
                  <span className="fv-stat-l">Total</span>
                </div>
                <div className="fv-stat" style={{background:'#e0f2fe'}}>
                  <span className="fv-stat-n" style={{color:'#0284c7'}}>2</span>
                  <span className="fv-stat-l">To Do</span>
                </div>
                <div className="fv-stat" style={{background:'#f3e8ff'}}>
                  <span className="fv-stat-n" style={{color:'#7e22ce'}}>3</span>
                  <span className="fv-stat-l">In Progress</span>
                </div>
                <div className="fv-stat" style={{background:'#dcfce7'}}>
                  <span className="fv-stat-n" style={{color:'#16a34a'}}>1</span>
                  <span className="fv-stat-l">Done</span>
                </div>
              </div>
              <div className="fv-progress-bar">
                <div className="fv-progress-fill" style={{width:'17%'}}></div>
              </div>
              <div className="fv-progress-label">17% complete</div>
              <div className="fv-project-row">
                <span className="fv-folder-icon">📁</span>
                <span className="fv-proj-name">Task Manager Frontend</span>
                <span className="fv-proj-badge">Owner</span>
              </div>
              <div className="fv-project-row">
                <span className="fv-folder-icon">📁</span>
                <span className="fv-proj-name">Task Manager Backend</span>
                <span className="fv-proj-badge fv-proj-badge--member">Member</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: All Tasks ── */}
      <section className="feat-section feat-section--alt">
        <div className="feat-row feat-row--reverse">
          <div className="feat-visual feat-visual--tasks">
            <div className="fv-card">
              <div className="fv-table-head">
                <span>TASK</span><span>STATUS</span><span>PRIORITY</span><span>DUE</span>
              </div>
              <div className="fv-table-row">
                <span className="fv-task-name">Interview Prep</span>
                <span className="fv-badge fv-badge--inprogress">In Progress</span>
                <span className="fv-badge fv-badge--medium">Medium</span>
                <span className="fv-overdue">Overdue</span>
              </div>
              <div className="fv-table-row">
                <span className="fv-task-name">Endpoints</span>
                <span className="fv-badge fv-badge--inprogress">In Progress</span>
                <span className="fv-badge fv-badge--high">High</span>
                <span className="fv-overdue">Overdue</span>
              </div>
              <div className="fv-table-row">
                <span className="fv-task-name fv-task-done">Play Hockey</span>
                <span className="fv-badge fv-badge--done">Completed</span>
                <span className="fv-badge fv-badge--medium">Medium</span>
                <span className="fv-done-date">May 22</span>
              </div>
              <div className="fv-table-row">
                <span className="fv-task-name">Create API</span>
                <span className="fv-badge fv-badge--todo">Todo</span>
                <span className="fv-badge fv-badge--medium">Medium</span>
                <span className="fv-overdue">Overdue</span>
              </div>
            </div>
          </div>
          <div className="feat-text">
            <span className="feat-tag feat-tag--purple">All Tasks</span>
            <h2>Every task, every project,<br/>one table</h2>
            <p>All Tasks pulls together everything across your personal lists and team projects into a single sortable table. Status, priority, due date, assignee — all visible, all editable without leaving the view.</p>
            <ul className="feat-list">
              <li><IconCheck /> Overdue tasks flagged in red automatically</li>
              <li><IconCheck /> Edit or delete tasks inline</li>
              <li><IconCheck /> Personal and project tasks unified</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Feature: Team ── */}
      <section className="feat-section">
        <div className="feat-row">
          <div className="feat-text">
            <span className="feat-tag feat-tag--green">Team</span>
            <h2>Invite your team,<br/>control the access</h2>
            <p>Add collaborators by email, assign them to specific projects, and set whether they're an Owner or Member. You stay in control of who can see and change what — without a settings maze.</p>
            <ul className="feat-list">
              <li><IconCheck /> Invite by email in one click</li>
              <li><IconCheck /> Per-project role assignment</li>
              <li><IconCheck /> Full directory of who has access to what</li>
            </ul>
          </div>
          <div className="feat-visual feat-visual--team">
            <div className="fv-card">
              <div className="fv-team-title">Team Directory</div>
              <div className="fv-member-row">
                <div className="fv-avatar">A</div>
                <div className="fv-member-info">
                  <span className="fv-member-email">ankit1122@gmail.com <em>(You)</em></span>
                  <div className="fv-role-tags">
                    <span className="fv-role fv-role--owner">Task Manager Frontend · OWNER</span>
                    <span className="fv-role fv-role--member">Task Manager Backend · MEMBER</span>
                  </div>
                </div>
              </div>
              <div className="fv-member-row">
                <div className="fv-avatar fv-avatar--teal">A</div>
                <div className="fv-member-info">
                  <span className="fv-member-email">ansh@gmail.com</span>
                  <div className="fv-role-tags">
                    <span className="fv-role fv-role--owner">Task Manager Backend · OWNER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature: Analytics ── */}
      <section className="feat-section feat-section--alt">
        <div className="feat-row feat-row--reverse">
          <div className="feat-visual feat-visual--analytics">
            <div className="fv-card">
              <div className="fv-analytics-stats">
                <div className="fv-analytics-stat">
                  <span className="fv-analytics-n">85</span>
                  <span className="fv-analytics-l">Prod Score</span>
                </div>
                <div className="fv-analytics-stat">
                  <span className="fv-analytics-n" style={{color:'#16a34a'}}>33%</span>
                  <span className="fv-analytics-l">Completion Rate</span>
                </div>
                <div className="fv-analytics-stat">
                  <span className="fv-analytics-n" style={{color:'#ef4444'}}>2</span>
                  <span className="fv-analytics-l">Overdue</span>
                </div>
              </div>
              <div className="fv-donut-row">
                <svg viewBox="0 0 80 80" width="80" height="80">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#f1f5f9" strokeWidth="12"/>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#16a34a" strokeWidth="12"
                    strokeDasharray="62.8 125.6" strokeDashoffset="15" strokeLinecap="round"/>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#ef4444" strokeWidth="12"
                    strokeDasharray="125.6 0" strokeDashoffset="-47.8" opacity="0.25" strokeLinecap="round"/>
                </svg>
                <div className="fv-donut-legend">
                  <span><i style={{background:'#16a34a'}}></i>Completed 33%</span>
                  <span><i style={{background:'#ef4444'}}></i>Overdue 67%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="feat-text">
            <span className="feat-tag feat-tag--amber">Analytics</span>
            <h2>Know exactly how<br/>productive you've been</h2>
            <p>Analytics runs a daily ETL pipeline on your task data and surfaces a Prod Score — a single number reflecting your completion rate, overdue tasks, and weekly momentum. Filter by personal tasks or any project.</p>
            <ul className="feat-list">
              <li><IconCheck /> Python ETL-powered Prod Score</li>
              <li><IconCheck /> Weekly activity and completion charts</li>
              <li><IconCheck /> Overdue task trends and action radar</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-section">
        <h2 className="how-title">Up and running in minutes</h2>
        <p className="how-sub">No onboarding call. No setup fee. Just sign up and start moving work forward.</p>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">01</div>
            <h3>Create a project</h3>
            <p>Give it a name, set it active. Invite teammates by email and assign each person an Owner or Member role.</p>
          </div>
          <div className="how-connector" />
          <div className="how-step">
            <div className="how-step-num">02</div>
            <h3>Add and assign tasks</h3>
            <p>Create tasks with due dates, priority levels, and assignees. Or just start with your personal My Tasks list — no project needed.</p>
          </div>
          <div className="how-connector" />
          <div className="how-step">
            <div className="how-step-num">03</div>
            <h3>Track and improve</h3>
            <p>Watch your Prod Score update daily. See what's overdue, what's moving, and where your team needs focus.</p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <h2 className="section-title">What people are saying</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="t-stars">★★★★★</div>
            <p className="t-body">"Finally a task tool that doesn't need a tutorial. I created a project, added my tasks, and had my whole sprint laid out in under ten minutes."</p>
            <div className="t-author">
              <div className="t-avatar">SL</div>
              <div><strong>Sarah L.</strong><span>Freelance Designer</span></div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="t-stars">★★★★★</div>
            <p className="t-body">"The overdue flagging alone is worth it. My whole team knows exactly what's slipping without anyone having to chase anyone."</p>
            <div className="t-author">
              <div className="t-avatar">DR</div>
              <div><strong>David R.</strong><span>Indie Developer</span></div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="t-stars">★★★★★</div>
            <p className="t-body">"I use My Tasks for personal stuff and team projects for uni group work. The fact that both show up in All Tasks together is genuinely useful."</p>
            <div className="t-author">
              <div className="t-avatar">PK</div>
              <div><strong>Priya K.</strong><span>University Student</span></div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="t-stars">★★★★★</div>
            <p className="t-body">"The Prod Score is weirdly motivating. Seeing that number drop when I miss deadlines has made me more disciplined than any reminder app I've tried."</p>
            <div className="t-author">
              <div className="t-avatar">AG</div>
              <div><strong>Alex G.</strong><span>Content Creator</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Start tracking your work today</h2>
          <p className="cta-sub">Free to use. No credit card. Works solo or with a team.</p>
          <div className="cta-actions">
            <button onClick={() => openAuth('signup')} className="btn-cta-primary">
              Create your workspace <IconArrowRight />
            </button>
            <button onClick={() => openAuth('login')} className="btn-cta-ghost">
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <LogoIcon />
              <span className="brand-text">TaskPilot</span>
            </div>
            <p className="footer-tagline">Track tasks. Know your score. Ship faster.</p>
          </div>
          <div className="footer-links-col">
            <div className="footer-link-group">
              <span className="footer-link-heading">Product</span>
              <a href="#">Dashboard</a>
              <a href="#">Projects</a>
              <a href="#">Analytics</a>
              <a href="#">Team</a>
            </div>
            <div className="footer-link-group">
              <span className="footer-link-heading">Account</span>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuth('signup'); }}>Sign up free</a>
              <a href="#" onClick={(e) => { e.preventDefault(); openAuth('login'); }}>Log in</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2026 TaskPilot. Built for the modern web.</p>
        </div>
      </footer>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <MarketingPage />;
};

export default LandingPage;