import React, { useEffect, useState } from 'react';
import { Task } from '../../types';
import { tasksAPI } from '../../services/api';
import '../styles/TaskList.css';

interface TaskListProps {
  refreshTrigger: number;
  priority?: string;
  status?: string;
}

export const TaskList: React.FC<TaskListProps> = ({ refreshTrigger, priority, status }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger, priority, status]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getAll(priority, status);
      setTasks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId: string) => {
    try {
      await tasksAPI.toggle(taskId);
      fetchTasks();
    } catch (err: any) {
      alert('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        fetchTasks();
      } catch (err: any) {
        alert('Failed to delete task');
      }
    }
  };

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="task-list-container">
      <h2>Your Tasks</h2>
      {tasks.length === 0 ? (
        <p className="no-tasks">No tasks found. Create one to get started!</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={`task-item ${task.status.toLowerCase()}`}>
              <div className="task-content">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && <p className="task-description">{task.description}</p>}
                <div className="task-meta">
                  <span className="status">{task.status}</span>
                  {task.due_date && <span className="due-date">{task.due_date}</span>}
                </div>
              </div>
              <div className="task-actions">
                <button
                  onClick={() => handleToggle(task.id)}
                  className="btn-toggle"
                >
                  {task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button onClick={() => handleDelete(task.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};