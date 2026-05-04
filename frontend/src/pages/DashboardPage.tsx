import React, { useCallback, useEffect, useState } from 'react';
import { tasksAPI, workspaceAPI } from '../services/api';
import { Task, UpdateTaskInput } from '../types';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await workspaceAPI.getAll();
      setWorkspaces(res.data || []);
    } catch {
      console.error('Workspace load failed');
    }
  }, []);

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
      setError(err?.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);

  const createTask = async () => {
    if (!title.trim()) return;

    try {
      const payload: any = { title };

      if (selectedWorkspace) {
        payload.workspace_id = selectedWorkspace;
      }

      const res = await tasksAPI.create(payload);
      setTasks(prev => [res.data, ...prev]);
      setTitle('');
    } catch {
      setError('Create failed');
    }
  };

  const inviteMember = async () => {
    if (!selectedWorkspace || !inviteEmail) return;

    try {
      await workspaceAPI.invite(selectedWorkspace, inviteEmail);
      alert('User invited');
      setInviteEmail('');
      setShowInvite(false);
    } catch {
      alert('Invite failed');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const data: UpdateTaskInput = {
      status: status as Task['status'],
      completed_at: status === 'Completed' ? new Date().toISOString() : null,
    };

    await tasksAPI.update(id, data);

    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...data } as Task : t))
    );
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;

    await tasksAPI.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="db">

      <div className="db__header">
        <h1 className="db__title">Dashboard</h1>

        <button
          className="db__new-btn"
          onClick={async () => {
            const name = prompt('Workspace name');
            if (!name) return;

            await workspaceAPI.create(name);
            loadWorkspaces();
          }}
        >
          + Workspace
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setSelectedWorkspace(null)}>Personal</button>

        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => setSelectedWorkspace(ws.id)}
            style={{ marginLeft: 8 }}
          >
            {ws.name}
          </button>
        ))}

        {selectedWorkspace && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            style={{ marginLeft: 10 }}
          >
            Invite
          </button>
        )}
      </div>

      {showInvite && (
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="User email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button onClick={inviteMember}>Send Invite</button>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={createTask}>Add Task</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        tasks.map(task => (
          <div key={task.id} style={{ border: '1px solid #ddd', padding: 10, marginBottom: 10 }}>
            <h3>{task.title}</h3>
            <p>{task.status}</p>

            <button onClick={() => updateStatus(task.id, 'Completed')}>
              Complete
            </button>

            <button onClick={() => deleteTask(task.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default DashboardPage;