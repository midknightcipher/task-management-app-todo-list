import React, { useEffect, useState } from 'react';
import { tasksAPI } from '../services/api';
import './DashboardPage.css';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In-Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string;
  created_at: string;
  completed_at?: string;
}

/* ─── Tiny inline icons ───────────────────────────────────── */
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

/* ─── Helpers ─────────────────────────────────────────────── */
const priorityConfig = {
  High:   { color: 'var(--priority-high-color)',   bg: 'var(--priority-high-bg)'   },
  Medium: { color: 'var(--priority-med-color)',    bg: 'var(--priority-med-bg)'    },
  Low:    { color: 'var(--priority-low-color)',    bg: 'var(--priority-low-bg)'    },
};
const statusConfig = {
  'Todo':        { color: 'var(--status-todo-color)',       bg: 'var(--status-todo-bg)',       label: 'To Do'       },
  'In-Progress': { color: 'var(--status-progress-color)',   bg: 'var(--status-progress-bg)',   label: 'In Progress' },
  'Completed':   { color: 'var(--status-done-color)',       bg: 'var(--status-done-bg)',       label: 'Done'        },
};

const Badge = ({ text, color, bg }: { text: string; color: string; bg: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 500, padding: '3px 8px',
    borderRadius: 5, color, background: bg, letterSpacing: '0.01em',
  }}>{text}</span>
);

const isOverdue = (due?: string) =>
  due && new Date(due) < new Date() ? true : false;

/* ─── Stat card ───────────────────────────────────────────── */
const StatCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="stat-card">
    <div className="stat-card__bar" style={{ background: accent }} />
    <p className="stat-card__value">{value}</p>
    <p className="stat-card__label">{label}</p>
  </div>
);

/* ─── Task card ───────────────────────────────────────────── */
const TaskCard: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}> = ({ task, onStatusChange, onDelete }) => {
  const p = priorityConfig[task.priority];
  const s = statusConfig[task.status];
  const overdue = isOverdue(task.due_date);

  const nextStatus = { 'Todo': 'In-Progress', 'In-Progress': 'Completed', 'Completed': 'Todo' } as const;
  const nextLabel  = { 'Todo': 'Start', 'In-Progress': 'Complete', 'Completed': 'Reopen' } as const;

  return (
    <div className={`task-card${task.status === 'Completed' ? ' task-card--done' : ''}`}>
      <div className="task-card__accent" style={{ background: p.color }} />
      <div className="task-card__body">
        <div className="task-card__top">
          <h3 className="task-card__title">{task.title}</h3>
          <div className="task-card__badges">
            <Badge text={task.priority}  color={p.color} bg={p.bg} />
            <Badge text={s.label}        color={s.color} bg={s.bg} />
          </div>
        </div>

        {task.description && (
          <p className="task-card__desc">{task.description}</p>
        )}

        <div className="task-card__meta">
          {task.due_date && (
            <span className={`task-card__date${overdue && task.status !== 'Completed' ? ' task-card__date--overdue' : ''}`}>
              <IconCalendar />
              {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {overdue && task.status !== 'Completed' && <span> · Overdue</span>}
            </span>
          )}
          {task.completed_at && (
            <span className="task-card__date" style={{ color: 'var(--status-done-color)' }}>
              <IconCalendar />
              Done {new Date(task.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        <div className="task-card__actions">
          <button
            className="task-btn task-btn--primary"
            onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          >
            {nextLabel[task.status]}
          </button>
          <button
            className="task-btn task-btn--ghost task-btn--danger"
            onClick={() => onDelete(task.id)}
            title="Delete task"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────── */
const DashboardPage: React.FC = () => {
  const [tasks, setTasks]                 = useState<Task[]>([]);
  const [title, setTitle]                 = useState('');
  const [description, setDescription]     = useState('');
  const [priority, setPriority]           = useState('Medium');
  const [dueDate, setDueDate]             = useState('');
  const [statusFilter, setStatusFilter]   = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [loading, setLoading]             = useState(false);
  const [formOpen, setFormOpen]           = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => { fetchTasks(); }, [statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const status   = statusFilter   !== 'All Statuses'   ? statusFilter   : undefined;
      const prio     = priorityFilter !== 'All Priorities' ? priorityFilter : undefined;
      const response = await tasksAPI.getAll(prio, status);
      setTasks(response.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      const response = await tasksAPI.create({ title, description, priority, due_date: dueDate || null, status: 'Todo' });
      if (response.data) {
        setTasks([response.data, ...tasks]);
        setTitle(''); setDescription(''); setPriority('Medium'); setDueDate('');
        setFormOpen(false);
      }
    } catch { /* silent */ } finally { setSubmitting(false); }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus, completed_at: newStatus === 'Completed' ? new Date().toISOString() : null };
      await tasksAPI.update(taskId, updateData);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updateData } : t));
    } catch { /* silent */ }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch { /* silent */ }
  };

  /* Derived stats */
  const stats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'Todo').length,
    inProgress: tasks.filter(t => t.status === 'In-Progress').length,
    done:       tasks.filter(t => t.status === 'Completed').length,
  };

  return (
    <div className="db">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="db__header">
        <div>
          <h1 className="db__title">Dashboard</h1>
          <p className="db__subtitle">Track and manage your tasks</p>
        </div>
        <button className="db__new-btn" onClick={() => setFormOpen(o => !o)}>
          <IconPlus />
          New Task
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="db__stats">
        <StatCard label="Total"       value={stats.total}      accent="#4f7eff" />
        <StatCard label="To Do"       value={stats.todo}       accent="#f59e0b" />
        <StatCard label="In Progress" value={stats.inProgress} accent="#6366f1" />
        <StatCard label="Completed"   value={stats.done}       accent="#10b981" />
      </div>

      {/* ── Create task panel ───────────────────────────── */}
      {formOpen && (
        <div className="db__form-wrap">
          <div className="db__form-header">
            <h2 className="db__form-title">New Task</h2>
            <button className="db__form-close" onClick={() => setFormOpen(false)}>✕</button>
          </div>
          <form onSubmit={handleCreateTask} className="db__form">
            <div className="db__form-row">
              <div className="db__field db__field--grow">
                <label className="db__label">Title <span className="db__required">*</span></label>
                <input
                  className="db__input"
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="db__field">
              <label className="db__label">Description</label>
              <textarea
                className="db__input db__textarea"
                placeholder="Add more context..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="db__form-row">
              <div className="db__field">
                <label className="db__label">Priority</label>
                <select className="db__input db__select" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="db__field">
                <label className="db__label">Due date</label>
                <input className="db__input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="db__form-footer">
              <button type="button" className="db__btn db__btn--ghost" onClick={() => setFormOpen(false)}>Cancel</button>
              <button type="submit" className="db__btn db__btn--primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────── */}
      <div className="db__filters">
        <div className="db__filter-group">
          {['All Statuses', 'Todo', 'In-Progress', 'Completed'].map(s => (
            <button
              key={s}
              className={`db__filter-btn${statusFilter === s ? ' db__filter-btn--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >{s === 'All Statuses' ? 'All' : s === 'In-Progress' ? 'In Progress' : s}</button>
          ))}
        </div>
        <select
          className="db__input db__select db__select--sm"
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option>All Priorities</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {/* ── Task list ───────────────────────────────────── */}
      <div className="db__list">
        {loading && (
          <div className="db__empty">
            <div className="db__spinner" />
            <p>Loading tasks…</p>
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="db__empty">
            <p className="db__empty-title">No tasks found</p>
            <p className="db__empty-sub">Create your first task to get started.</p>
          </div>
        )}

        {!loading && tasks.map(task => (
          <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;