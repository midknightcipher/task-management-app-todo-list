import React, { useCallback, useEffect, useState } from 'react';
import { tasksAPI, workspaceAPI } from '../services/api';
import { Task, Workspace, WorkspaceMember } from '../types';
import './DashboardPage.css';
import './Pages.css';

const IconStack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>;
const IconClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconLightning = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconStar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
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
      const [tasksRes, wsRes] = await Promise.all([tasksAPI.getAll(), workspaceAPI.getAll()]);
      setTasks(tasksRes.data || []);
      setWorkspaces(wsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (workspaceId) {
      workspaceAPI.getMembers(workspaceId).then(res => setMembers(res.data || [])).catch(() => setMembers([]));
    } else {
      setMembers([]); setAssigneeEmail('');
    }
  }, [workspaceId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksAPI.create({
        title, description, priority, status: 'Todo',
        due_date: dueDate || null, workspace_id: workspaceId || null, assignee_email: assigneeEmail || null
      });
      setShowTaskForm(false);
      setTitle(''); setDescription(''); setDueDate(''); setWorkspaceId(''); setAssigneeEmail('');
      fetchDashboardData();
    } catch (err) { alert("Failed to create task"); }
  };

  const stats = {
    total: tasks.length, todo: tasks.filter((t) => t.status === 'Todo').length,
    prog: tasks.filter((t) => t.status === 'In-Progress').length, done: tasks.filter((t) => t.status === 'Completed').length,
  };
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  
  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="db__page">
      <div className="db__main">
        <div className="pg__header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="pg__title">Dashboard</h1>
            <p className="pg__subtitle">Welcome back! Here's what's happening.</p>
          </div>
          <button className="pg__btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
            <IconPlus /> {showTaskForm ? 'Cancel' : 'Create Task'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="db__stats-grid">
          <div className="db__stat-card"><div className="db__stat-icon blue"><IconStack /></div><div className="db__stat-info"><h3>{stats.total}</h3><p>Total Tasks<br/><span>{completionPct}% complete</span></p></div></div>
          <div className="db__stat-card"><div className="db__stat-icon yellow"><IconClock /></div><div className="db__stat-info"><h3>{stats.todo}</h3><p>To Do</p></div></div>
          <div className="db__stat-card"><div className="db__stat-icon purple"><IconLightning /></div><div className="db__stat-info"><h3>{stats.prog}</h3><p>In Progress</p></div></div>
          <div className="db__stat-card"><div className="db__stat-icon green"><IconStar /></div><div className="db__stat-info"><h3>{stats.done}</h3><p>Completed</p></div></div>
        </div>

        <div className="db__progress-row" style={{marginBottom: '32px'}}>
          <div className="db__progress-wrap"><div className="db__progress-bar" style={{ width: `${completionPct}%` }} /></div>
          <span className="db__progress-text" style={{fontSize: '12px', fontWeight: 600, color: '#64748b'}}>{completionPct}% complete</span>
        </div>

        {/* INLINE CREATE TASK FORM */}
        {showTaskForm && (
          <div className="inline-task-form" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="input-group">
                <label>Task Title</label>
                <input type="text" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Description (optional)</label>
                <textarea 
                  placeholder="Add details or context..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3} 
                />
              </div>
              <div className="db__form-row-3">
                <div className="input-group">
                  <label>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)}>
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="db__form-row-3">
                <div className="input-group">
                  <label>Project / Location</label>
                  <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)}>
                    <option value="">🔒 Personal Task (Private)</option>
                    {workspaces
                        .filter(ws => ws.my_role === 'owner' || ws.my_role === 'admin') // ✅ Filters out 'member' roles
                        .map(ws => <option key={ws.id} value={ws.id}>📁 {ws.name}</option>)
                    }
                  </select>
                </div>
                {workspaceId !== '' && (
                  <div className="input-group">
                    <label>Assign To (Optional)</label>
                    <select value={assigneeEmail} onChange={e => setAssigneeEmail(e.target.value)}>
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.user_id} value={m.email}>{m.email} ({m.role})</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="submit" className="pg__btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Activity */}
        <div className="db__activity-section">
          <h2 className="db__section-title">Recent Activity</h2>
          <div className="db__activity-list">
            {recentActivity.length === 0 && <p className="text-muted">No recent activity.</p>}
            {recentActivity.map((task) => (
              <div className="activity-item" key={task.id}>
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p><strong>{task.title}</strong> was marked as <span className={`badge-status ${task.status.toLowerCase()}`}>{task.status}</span></p>
                  <span className="activity-time">{task.workspace_id ? 'In Project' : 'Personal Task'} {task.assignee_email ? `• Assigned to ${task.assignee_email.split('@')[0]}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;