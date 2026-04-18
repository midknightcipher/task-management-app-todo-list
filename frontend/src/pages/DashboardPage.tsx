import React, { useCallback, useEffect, useState } from 'react';
import { tasksAPI } from '../services/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import './DashboardPage.css';

/* ── Icons ─────────────────────────────────────────────────── */
const I = {
  plus:         () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:        () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  cal:          () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  layers:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  clock:        () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  zap:          () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  star:         () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  chevronDown:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  alertCircle:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  inbox:        () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  bell:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

/* ── Config ────────────────────────────────────────────────── */
const PRIORITY = {
  High:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  Medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  Low:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};
const STATUS = {
  'Todo':        { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', label: 'To Do'       },
  'In-Progress': { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', label: 'In Progress' },
  'Completed':   { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Done'        },
};

/* ── Badge ─────────────────────────────────────────────────── */
const Badge = ({ text, color, bg, border }: { text: string; color: string; bg: string; border: string }) => (
  <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, color, background: bg, border: `1px solid ${border}`, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
    {text}
  </span>
);

/* ── Stat card ─────────────────────────────────────────────── */
interface StatProps { label: string; value: number; icon: React.ReactNode; gradient: string; iconColor: string; sub?: string; }
const StatCard = ({ label, value, icon, gradient, iconColor, sub }: StatProps) => (
  <div className="db-stat">
    <div className="db-stat__icon" style={{ background: gradient, color: iconColor }}>{icon}</div>
    <div className="db-stat__body">
      <p className="db-stat__value">{value}</p>
      <p className="db-stat__label">{label}</p>
      {sub && <p className="db-stat__sub">{sub}</p>}
    </div>
  </div>
);

/* ── Today reminder ────────────────────────────────────────── */
const TodayReminder = ({ tasks }: { tasks: Task[] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueToday = tasks.filter(t => {
    if (t.status === 'Completed' || !t.due_date) return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  });

  if (dueToday.length === 0) return null;

  // Build a readable list of task names
  const names = dueToday.map(t => t.title);
  const displayNames =
    names.length === 1
      ? `"${names[0]}"`
      : names.length === 2
      ? `"${names[0]}" and "${names[1]}"`
      : `"${names[0]}", "${names[1]}" and ${names.length - 2} more`;

  return (
    <div className="db__reminder">
      <div className="db__reminder-icon">
        <I.bell />
      </div>
      <div className="db__reminder-body">
        <p className="db__reminder-title">
          Reminder — {dueToday.length} task{dueToday.length > 1 ? 's' : ''} due today
        </p>
        <p className="db__reminder-sub">{displayNames}</p>
      </div>
    </div>
  );
};

/* ── Task card ─────────────────────────────────────────────── */
const TaskCard: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  animDelay?: number;
}> = ({ task, onStatusChange, onDelete, animDelay = 0 }) => {
  const p = PRIORITY[task.priority];
  const s = STATUS[task.status];
  const overdue = !!task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';

  const next      = { 'Todo': 'In-Progress', 'In-Progress': 'Completed', 'Completed': 'Todo' } as const;
  const nextLabel = { 'Todo': 'Start task',  'In-Progress': 'Mark done', 'Completed': 'Reopen' } as const;

  return (
    <div
      className={`db-task${task.status === 'Completed' ? ' db-task--done' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="db-task__priority-bar" style={{ background: p.color }} />
      <div className="db-task__body">
        <div className="db-task__head">
          <h3 className="db-task__title">{task.title}</h3>
          <div className="db-task__badges">
            <Badge text={task.priority} color={p.color} bg={p.bg} border={p.border} />
            <Badge text={s.label}       color={s.color} bg={s.bg} border={s.border} />
          </div>
        </div>

        {task.description && <p className="db-task__desc">{task.description}</p>}

        <div className="db-task__meta">
          {task.due_date && (
            <span className={`db-task__date${overdue ? ' db-task__date--overdue' : ''}`}>
              <I.cal />
              {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {overdue && <span className="db-task__overdue-pill"><I.alertCircle /> Overdue</span>}
            </span>
          )}
          {task.completed_at && (
            <span className="db-task__date" style={{ color: '#059669' }}>
              <I.check />
              Done {new Date(task.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        <div className="db-task__actions">
          <button
            className={`db-task__btn db-task__btn--action${task.status === 'Completed' ? ' db-task__btn--reopen' : ''}`}
            onClick={() => onStatusChange(task.id, next[task.status])}
          >
            {task.status === 'In-Progress' && <I.check />}
            {nextLabel[task.status]}
          </button>
          <button className="db-task__btn db-task__btn--delete" onClick={() => onDelete(task.id)} title="Delete">
            <I.trash />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Skeleton ──────────────────────────────────────────────── */
const TaskSkeleton = () => (
  <div className="db-skeleton">
    <div className="db-skeleton__bar" />
    <div className="db-skeleton__body">
      <div className="db-skeleton__line db-skeleton__line--title" />
      <div className="db-skeleton__line db-skeleton__line--sub" />
      <div className="db-skeleton__line db-skeleton__line--short" />
    </div>
  </div>
);

/* ── Empty state ───────────────────────────────────────────── */
const EmptyState = ({ onNew }: { onNew: () => void }) => (
  <div className="db-empty">
    <div className="db-empty__icon"><I.inbox /></div>
    <h3 className="db-empty__title">No tasks yet</h3>
    <p className="db-empty__sub">Create your first task to get started tracking your work.</p>
    <button className="db-empty__btn" onClick={onNew}>
      <I.plus /> Create task
    </button>
  </div>
);

/* ── Main page ─────────────────────────────────────────────── */
const DashboardPage: React.FC = () => {
  const [tasks, setTasks]                   = useState<Task[]>([]);
  const [title, setTitle]                   = useState('');
  const [description, setDescription]       = useState('');
  const [priority, setPriority]             = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate]               = useState('');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [formOpen, setFormOpen]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Always fetch ALL tasks so stats stay accurate regardless of active filter
      const res = await tasksAPI.getAll();
      setTasks(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      const payload: CreateTaskInput = {
        title, description, priority,
        due_date: dueDate || null,
        status: 'Todo',
      };
      const res = await tasksAPI.create(payload);
      if (res.data) {
        setTasks(p => [res.data, ...p]);
        setTitle(''); setDescription(''); setPriority('Medium'); setDueDate('');
        setFormOpen(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setError('');
      const data: UpdateTaskInput = {
        status: status as Task['status'],
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      };
      await tasksAPI.update(id, data);
      setTasks(p => p.map(t => t.id === id ? { ...t, ...data } as Task : t));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update task.');
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      setError('');
      await tasksAPI.delete(id);
      setTasks(p => p.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete task.');
    }
  };

  // Stats always computed from full task list
  const stats = {
    total: tasks.length,
    todo:  tasks.filter(t => t.status === 'Todo').length,
    prog:  tasks.filter(t => t.status === 'In-Progress').length,
    done:  tasks.filter(t => t.status === 'Completed').length,
  };

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const FILTERS = ['All', 'Todo', 'In Progress', 'Completed'];

  // Apply filters locally for display only
  const displayedTasks = tasks.filter(t => {
    const statusMatch =
      statusFilter === 'All' ||
      (statusFilter === 'In Progress' ? t.status === 'In-Progress' : t.status === statusFilter);
    const priorityMatch =
      priorityFilter === 'All Priorities' || t.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  return (
    <div className="db">

      {/* ── Header ────────────────────────────────────── */}
      <div className="db__header">
        <div>
          <h1 className="db__title">Dashboard</h1>
          <p className="db__subtitle">
            {stats.total === 0
              ? 'No tasks yet — create one to get started'
              : `${stats.done} of ${stats.total} tasks completed · ${completionPct}% done`}
          </p>
        </div>
        <button className="db__new-btn" onClick={() => setFormOpen(o => !o)}>
          <I.plus />
          New Task
        </button>
      </div>

      {/* ── Error banner ──────────────────────────────── */}
      {error && (
        <div className="db__error">
          <I.alertCircle />
          {error}
          <button className="db__error-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ── Today reminder ────────────────────────────── */}
      <TodayReminder tasks={tasks} />

      {/* ── Stat cards ────────────────────────────────── */}
      <div className="db__stats">
        <StatCard label="Total Tasks" value={stats.total} icon={<I.layers />} gradient="linear-gradient(135deg,#e0f2fe,#bae6fd)" iconColor="#0284c7" sub={`${completionPct}% complete`} />
        <StatCard label="To Do"       value={stats.todo}  icon={<I.clock />}  gradient="linear-gradient(135deg,#fffbeb,#fde68a)" iconColor="#d97706" />
        <StatCard label="In Progress" value={stats.prog}  icon={<I.zap />}    gradient="linear-gradient(135deg,#eef2ff,#c7d2fe)" iconColor="#6366f1" />
        <StatCard label="Completed"   value={stats.done}  icon={<I.star />}   gradient="linear-gradient(135deg,#ecfdf5,#a7f3d0)" iconColor="#059669" />
      </div>

      {/* ── Progress bar ──────────────────────────────── */}
      {stats.total > 0 && (
        <div className="db__progress">
          <div className="db__progress-bar">
            <div className="db__progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="db__progress-label">{completionPct}% complete</span>
        </div>
      )}

      {/* ── New task form ──────────────────────────────── */}
      {formOpen && (
        <div className="db__form-card">
          <div className="db__form-header">
            <h2 className="db__form-title">New Task</h2>
            <button className="db__form-close" onClick={() => setFormOpen(false)}>✕</button>
          </div>
          <form onSubmit={handleCreate} className="db__form">
            <div className="db__form-row">
              <div className="db__field db__field--grow">
                <label className="db__label">Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="db__input" type="text" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
              </div>
            </div>
            <div className="db__field">
              <label className="db__label">Description <span className="db__label-opt">(optional)</span></label>
              <textarea className="db__input db__textarea" placeholder="Add details or context..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="db__form-row">
              <div className="db__field">
                <label className="db__label">Priority</label>
                <select className="db__input db__select" value={priority} onChange={e => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}>
                  <option>Low</option><option>Medium</option><option>High</option>
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
                {submitting ? <><span className="db__spinner-sm" /> Creating…</> : <><I.plus /> Create Task</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────── */}
      <div className="db__filters">
        <div className="db__filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`db__filter-tab${statusFilter === f ? ' db__filter-tab--active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
              {f !== 'All' && (
                <span className="db__filter-count">
                  {f === 'Todo' ? stats.todo : f === 'In Progress' ? stats.prog : stats.done}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="db__filter-right">
          <div className="db__select-wrap">
            <select className="db__input db__select db__select--sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option>All Priorities</option>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
            <I.chevronDown />
          </div>
        </div>
      </div>

      {/* ── Task list ─────────────────────────────────── */}
      <div className="db__list">
        {loading && [1, 2, 3].map(i => <TaskSkeleton key={i} />)}
        {!loading && tasks.length === 0 && !error && <EmptyState onNew={() => setFormOpen(true)} />}
        {!loading && tasks.length > 0 && displayedTasks.length === 0 && (
          <div className="db-empty" style={{ padding: "32px 0" }}><p className="db-empty__sub">No tasks match the current filter.</p></div>
        )}
        {!loading && displayedTasks.map((task, i) => (
          <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onDelete={deleteTask} animDelay={i * 40} />
        ))}
      </div>

    </div>
  );
};

export default DashboardPage;
