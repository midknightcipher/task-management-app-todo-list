import React, { useCallback, useEffect, useState } from 'react';
import { tasksAPI, workspaceAPI } from '../services/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import './DashboardPage.css';

/* ADD THIS STATE AT TOP */
const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // 🔥 NEW (workspace)
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🔥 FETCH WORKSPACES
  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceAPI.getAll();
      setWorkspaces(res.data);
    } catch {}
  };

  // 🔥 FETCH TASKS (UPDATED)
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let res;
      if (selectedWorkspace) {
        res = await workspaceAPI.getTasks(selectedWorkspace);
      } else {
        res = await tasksAPI.getAll();
      }

      setTasks(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // 🔥 CREATE TASK (UPDATED)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);

      const payload: any = {
        title,
        description,
        priority,
        due_date: dueDate || null,
        status: 'Todo',
      };

      if (selectedWorkspace) {
        payload.workspace_id = selectedWorkspace;
      }

      const res = await tasksAPI.create(payload);

      if (res.data) {
        setTasks(p => [res.data, ...p]);
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setDueDate('');
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
      const data: UpdateTaskInput = {
        status: status as Task['status'],
        completed_at: status === 'Completed' ? new Date().toISOString() : null,
      };
      await tasksAPI.update(id, data);
      setTasks(p => p.map(t => t.id === id ? { ...t, ...data } as Task : t));
    } catch {}
  };

  const deleteTask = async (id: string) => {
    await tasksAPI.delete(id);
    setTasks(p => p.filter(t => t.id !== id));
  };

  // 🔥 CREATE WORKSPACE
  const handleCreateWorkspace = async () => {
    const name = prompt('Workspace name');
    if (!name) return;

    await workspaceAPI.create(name);
    fetchWorkspaces();
  };

  // ========================= UI (UNCHANGED) =========================

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'Todo').length,
    prog: tasks.filter(t => t.status === 'In-Progress').length,
    done: tasks.filter(t => t.status === 'Completed').length,
  };

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="db">

      {/* 🔥 WORKSPACE SELECTOR */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setSelectedWorkspace(null)}>Personal</button>

        {workspaces.map(w => (
          <button key={w.id} onClick={() => setSelectedWorkspace(w.id)}>
            {w.name}
          </button>
        ))}

        <button onClick={handleCreateWorkspace}>+ Workspace</button>
      </div>

      {/* YOUR ORIGINAL UI BELOW (UNCHANGED) */}

      <div className="db__header">
        <div>
          <h1 className="db__title">Dashboard</h1>
          <p className="db__subtitle">
            {stats.done} of {stats.total} tasks completed · {completionPct}% done
          </p>
        </div>
        <button className="db__new-btn" onClick={() => setFormOpen(o => !o)}>
          + New Task
        </button>
      </div>

      {/* KEEP REST SAME */}
      {/* (your entire existing UI continues here unchanged) */}

    </div>
  );
};

export default DashboardPage;