import React, { useState } from 'react';
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

  const openAuth = (mode: 'login' | 'signup') => {
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
        <div className="landing-nav-links">
          <button onClick={() => openAuth('login')} className="btn-secondary">Log in</button>
          <button onClick={() => openAuth('signup')} className="btn-primary">Get Started</button>
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

      {/* ── Bento Grid (Clean Text Version) ── */}
      <section className="bento-section">
        <h2 className="bento-title">
            Everything you need to stay <span>organized.</span>
        </h2>

        <p className="bento-subtitle">
            Manage projects, track progress, collaborate with teams,
            and stay productive from a single workspace.
        </p>

        <div className="bento-grid">
            <div className="bento-card bg-soft-blue wide">
            <h3>Projects & Tasks</h3>
            <p>
                Create projects, break work into tasks,
                and keep everything organized in one place.
            </p>
            </div>

            <div className="bento-card bg-soft-orange">
            <h3>Personal Workspace</h3>
            <p>
                Manage your private goals, study plans,
                and daily tasks separately from team projects.
            </p>
            </div>

            <div className="bento-card bg-soft-green">
            <h3>Team Collaboration</h3>
            <p>
                Assign work, track ownership,
                and keep everyone aligned.
            </p>
            </div>

            <div className="bento-card bg-soft-purple">
            <h3>Progress Tracking</h3>
            <p>
                Monitor task completion,
                project health and productivity.
            </p>
            </div>

            <div className="bento-card bg-soft-pink">
            <h3>Activity History</h3>
            <p>
                View recent updates, completed tasks,
                and project activity at a glance.
            </p>
            </div>
        </div>
    </section>

      {/* ── Feature Rows (Diagrams) ── */}
      <section className="feature-row-section">

  {/* Row 1 */}
  <div className="feature-row">
    <div className="feature-text">
      <h2>Personal & Team Workspaces</h2>

      <p>
        Keep your private tasks separate from team projects while managing
        everything from one workspace. Stay focused on your own goals without
        losing visibility into collaborative work.
      </p>
    </div>

    <div className="f-diagram-box">
      <div className="workspace-diagram">

        <div className="workspace-column">
          <div className="workspace-header">My Tasks</div>

          <div className="workspace-task">Interview Prep</div>
          <div className="workspace-task">Research Paper</div>
          <div className="workspace-task">Gym Routine</div>
        </div>

        <div className="workspace-column">
          <div className="workspace-header">Team Projects</div>

          <div className="workspace-task">Frontend</div>
          <div className="workspace-task">Backend</div>
          <div className="workspace-task">Documentation</div>
        </div>

      </div>
    </div>
  </div>

  {/* Row 2 */}
  <div className="feature-row">

    <div className="f-diagram-box">
      <div className="progress-diagram">

        <div className="progress-stats">

          <div className="progress-stat">
            <span>Total Tasks</span>
            <strong>6</strong>
          </div>

          <div className="progress-stat">
            <span>To Do</span>
            <strong>2</strong>
          </div>

          <div className="progress-stat">
            <span>In Progress</span>
            <strong>3</strong>
          </div>

          <div className="progress-stat">
            <span>Completed</span>
            <strong>1</strong>
          </div>

        </div>

        <div className="progress-bar-wrapper">
          <div className="progress-bar-fill"></div>
        </div>

        <div className="progress-percent">
          17% Complete
        </div>

      </div>
    </div>

    <div className="feature-text">
      <h2>Real-Time Progress Tracking</h2>

      <p>
        See exactly what's happening across your workspace with live task
        status updates, project visibility and activity tracking.
      </p>
    </div>

  </div>

  {/* Row 3 */}
  <div className="feature-row">

    <div className="feature-text">
      <h2>Manage Every Project From One Place</h2>

      <p>
        Create projects, organize work, assign ownership and track milestones
        without switching between multiple tools.
      </p>
    </div>

    <div className="f-diagram-box">
      <div className="project-diagram">

        <div className="project-card">
          Development
        </div>

        <div className="project-card">
          Marketing
        </div>

        <div className="project-card">
          Personal
        </div>

      </div>
    </div>

  </div>

  {/* Row 4 */}
  <div className="feature-row">

    <div className="f-diagram-box">
      <div className="team-diagram">

        <div className="team-member">
          <span>Ansh</span>
          <strong>4 Tasks</strong>
        </div>

        <div className="team-member">
          <span>Ankit</span>
          <strong>3 Tasks</strong>
        </div>

        <div className="team-member">
          <span>Rahul</span>
          <strong>2 Tasks</strong>
        </div>

      </div>
    </div>

    <div className="feature-text">
      <h2>Know What Your Team Is Working On</h2>

      <p>
        Track ownership, monitor activity and understand project progress
        without endless status meetings.
      </p>
    </div>

  </div>

</section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        <p className="section-subtitle">Join thousands of freelancers, students, and startup founders who use TaskPilot to plan their days and achieve their goals.</p>
        
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="t-quote">"Finally, a tool that adapts to my messy brain."</p>
            <p className="t-body">Most platforms forced me into rigid corporate structures. TaskPilot is different — it’s light enough for my grocery lists but powerful enough to manage my freelance design clients.</p>
            <div className="t-author">
              <strong>Sarah L.</strong>
              <span>Freelance Designer</span>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="t-quote">"Built my entire side-hustle using this app."</p>
            <p className="t-body">Working a 9-to-5 while launching a startup is exhausting. TaskPilot kept my weekend projects organized so I always knew exactly what to build next when I sat down at my laptop.</p>
            <div className="t-author">
              <strong>David R.</strong>
              <span>Indie Developer</span>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="t-quote">"Replaced my chaotic sticky-note system."</p>
            <p className="t-body">Between university assignments, an internship, and a social life, I was dropping the ball everywhere. Now, I just throw everything into TaskPilot and let it handle my schedule.</p>
            <div className="t-author">
              <strong>Priya K.</strong>
              <span>University Student</span>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="t-quote">"The UI is gorgeous and lightning fast."</p>
            <p className="t-body">I'm incredibly picky about the apps I use every day. The real-time syncing and clean, distraction-free interface make TaskPilot an absolute joy to use every morning.</p>
            <div className="t-author">
              <strong>Alex G.</strong>
              <span>Content Creator</span>
            </div>
          </div>
        </div>
      </section>


      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="landing-brand">
            <LogoIcon />
            <span className="brand-text">TaskPilot</span>
          </div>
          <p className="footer-copy">© 2026 TaskPilot. Built for the modern web.</p>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </div>
  );
};

const LandingPage: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <MarketingPage />;
};

export default LandingPage;