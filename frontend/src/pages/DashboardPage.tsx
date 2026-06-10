import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, workspaceAPI, analyticsAPI } from '../services/api';
import { Task, Workspace, WorkspaceMember } from '../types';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import AppLayout from '../components/AppLayout';
import './DashboardPage.css';

/* ─────────────────────────── Icons ─────────────────────────── */
const IconStack = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>;
const IconClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconLightning = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconStar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconArrow = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconFolder = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpis, setKpis] = useState({ total_tasks: 0, completed_tasks: 0, overdue_tasks: 0, completion_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low'|'Medium'|'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [assigneeEmail, setAssigneeEmail] = useState<string>('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, wsRes, kpiRes] = await Promise.all([
        tasksAPI.getAll(),
        workspaceAPI.getAll(),
        analyticsAPI.getKPIs()
      ]);
      setTasks(tasksRes.data || []);
      setWorkspaces(wsRes.data || []);
      setKpis(kpiRes.data || { total_tasks: 0, completed_tasks: 0, overdue_tasks: 0, completion_rate: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (workspaceId) {
      workspaceAPI.getMembers(workspaceId)
        .then(res => setMembers(res.data || []))
        .catch(() => setMembers([]));
    } else {
      setMembers([]);
      setAssigneeEmail('');
    }
  }, [workspaceId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksAPI.create({
        title, description, priority, status: 'Todo',
        due_date: dueDate || null,
        workspace_id: workspaceId || null,
        assignee_email: assigneeEmail || null,
      });
      setShowTaskForm(false);
      setTitle(''); setDescription(''); setDueDate(''); setWorkspaceId(''); setAssigneeEmail('');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const todoCount = tasks.filter(t => t.status === 'Todo').length;
  const progCount = tasks.filter(t => t.status === 'In-Progress').length;
  const completionPct = kpis.total_tasks > 0 ? Math.round(kpis.completion_rate * 100) : 0;

  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
    .slice(0, 5);

  const projectsWithTasks = workspaces.map(ws => {
    const projectTasks = tasks.filter(t => t.workspace_id === ws.id);
    const done = projectTasks.filter(t => t.status === 'Completed').length;
    const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;
    return { ...ws, taskCount: projectTasks.length, completedCount: done, pct };
  }).slice(0, 4);

  const displayName = user?.name || user?.email?.split('@')[0] || 'there';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const statusClass = (status: string) => {
    if (status === 'Completed') return 'ws-badge ws-badge--done';
    if (status === 'In-Progress') return 'ws-badge ws-badge--prog';
    return 'ws-badge ws-badge--todo';
  };

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="ws-content">
        <section className="ws-welcome" style={{ animationDelay: '0ms' }}>
          <div className="ws-welcome__text">
            <h1 className="ws-welcome__title">Welcome back, {displayName} 👋</h1>
            <p className="ws-welcome__sub">Here's what's happening with your work today.</p>
          </div>
          <div className="ws-task-bar">
            <button className={`ws-create-btn${showTaskForm ? ' ws-create-btn--cancel' : ''}`} onClick={() => setShowTaskForm(v => !v)}>
              {showTaskForm ? <><IconX /> Cancel</> : <><IconPlus /> Create Task</>}
            </button>
          </div>
        </section>

        {showTaskForm && (
          <div className="ws-form-card" style={{ animationDelay: '0ms' }}>
            <h2 className="ws-form-card__title">New Task</h2>
            <form onSubmit={handleCreateTask} className="ws-form">
              <div className="ws-field">
                <label>Task Title</label>
                <input type="text" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="ws-field">
                <label>Description <span>(optional)</span></label>
                <textarea placeholder="Add details or context..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="ws-form-row">
                <div className="ws-field">
                  <label>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)}>
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                  </select>
                </div>
                <div className="ws-field">
                  <label>Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="ws-form-row">
                <div className="ws-field">
                  <label>Project / Location</label>
                  <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)}>
                    <option value="">🔒 Personal Task (Private)</option>
                    {workspaces.filter(ws => ws.my_role === 'owner' || ws.my_role === 'admin').map(ws => <option key={ws.id} value={ws.id}>📁 {ws.name}</option>)}
                  </select>
                </div>
                {workspaceId !== '' && (
                  <div className="ws-field">
                    <label>Assign To <span>(optional)</span></label>
                    <select value={assigneeEmail} onChange={e => setAssigneeEmail(e.target.value)}>
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.user_id} value={m.email}>{m.email} ({m.role})</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="ws-form-actions">
                <button type="submit" className="ws-submit-btn">Save Task</button>
              </div>
            </form>
          </div>
        )}

        <section className="ws-stats" style={{ animationDelay: '40ms' }}>
          <div className="ws-stat-card">
            <div className="ws-stat-card__icon ws-stat-card__icon--amber"><IconStack /></div>
            <div className="ws-stat-card__body">
              <span className="ws-stat-card__num">{loading ? '–' : kpis.total_tasks}</span>
              <span className="ws-stat-card__label">Total Tasks</span>
              <span className="ws-stat-card__sub">{loading ? '' : `${completionPct}% complete`}</span>
            </div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-card__icon ws-stat-card__icon--blue"><IconClock /></div>
            <div className="ws-stat-card__body">
              <span className="ws-stat-card__num">{loading ? '–' : todoCount}</span>
              <span className="ws-stat-card__label">To Do</span>
            </div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-card__icon ws-stat-card__icon--violet"><IconLightning /></div>
            <div className="ws-stat-card__body">
              <span className="ws-stat-card__num">{loading ? '–' : progCount}</span>
              <span className="ws-stat-card__label">In Progress</span>
            </div>
          </div>
          <div className="ws-stat-card">
            <div className="ws-stat-card__icon ws-stat-card__icon--green"><IconStar /></div>
            <div className="ws-stat-card__body">
              <span className="ws-stat-card__num">{loading ? '–' : kpis.completed_tasks}</span>
              <span className="ws-stat-card__label">Completed</span>
            </div>
          </div>
        </section>

        {!loading && kpis.total_tasks > 0 && (
          <div className="ws-progress" style={{ animationDelay: '80ms' }}>
            <div className="ws-progress__track">
              <div className="ws-progress__fill" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="ws-progress__label">{completionPct}% complete</span>
          </div>
        )}

        <div className="ws-two-col" style={{ animationDelay: '120ms' }}>
          <section className="ws-section ws-section--projects">
            <div className="ws-section__head">
              <h2 className="ws-section__title">Projects</h2>
              <button className="ws-section__link" onClick={() => navigate('/projects')}>View all <IconArrow /></button>
            </div>
            {loading && <div className="ws-projects__empty">Loading projects…</div>}
            {!loading && projectsWithTasks.length === 0 && (
              <div className="ws-projects__empty">No projects yet. <button className="ws-projects__cta" onClick={() => navigate('/projects')}>Create one →</button></div>
            )}
            {!loading && projectsWithTasks.map((project, i) => (
              <div key={project.id} className="ws-project-row" style={{ animationDelay: `${140 + i * 30}ms` }} onClick={() => navigate('/projects')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/projects')}>
                <div className="ws-project-row__icon"><IconFolder /></div>
                <div className="ws-project-row__body">
                  <div className="ws-project-row__top"><span className="ws-project-row__name">{project.name}</span><span className="ws-project-row__count">{project.taskCount} tasks</span></div>
                  <div className="ws-project-row__track"><div className="ws-project-row__fill" style={{ width: `${project.pct}%` }} /></div>
                  <div className="ws-project-row__meta"><span className="ws-project-row__role">{project.my_role}</span><span className="ws-project-row__pct">{project.pct}%</span></div>
                </div>
              </div>
            ))}
          </section>

          <section className="ws-section ws-section--activity">
            <div className="ws-section__head">
              <h2 className="ws-section__title">Recent Activity</h2>
              <button className="ws-section__link" onClick={() => navigate('/all-tasks')}>View all <IconArrow /></button>
            </div>
            <div className="ws-activity-card">
              {loading && <div className="ws-activity__empty">Loading…</div>}
              {!loading && recentActivity.length === 0 && <div className="ws-activity__empty">No recent activity yet.</div>}
              {!loading && recentActivity.map((task, i) => (
                <div className="ws-activity-row" key={task.id} style={{ animationDelay: `${160 + i * 25}ms` }}>
                  <div className="ws-activity-row__dot" />
                  <div className="ws-activity-row__body">
                    <p className="ws-activity-row__text"><strong>{task.title}</strong></p>
                    <span className={statusClass(task.status)}>{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;