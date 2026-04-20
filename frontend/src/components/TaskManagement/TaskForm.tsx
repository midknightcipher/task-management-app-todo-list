import React, { useState } from 'react';
import { tasksAPI } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import '../styles/TaskForm.css';

interface TaskFormProps {
  onTaskCreated: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreated }) => {
  const { workspaceId, members } = useWorkspace();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate]       = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceId) {
      setError('No workspace selected. Please select a workspace first.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await tasksAPI.create({
        workspace_id: workspaceId,
        title,
        description,
        priority,
        due_date: dueDate || null,
        status: 'Todo',
        assigned_to: assignedTo || null,
      });

      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setAssignedTo('');
      onTaskCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!workspaceId) {
    return (
      <div className="task-form-container">
        <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
          Select a workspace to create tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="task-form-container">
      <h2>Create New Task</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {members.length > 0 && (
            <div className="form-group">
              <label htmlFor="assignedTo">Assign To</label>
              <select
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
};
