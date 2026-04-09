import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { formatToIST } from '../utils/dateFormatter';
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

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);

      const status =
        statusFilter !== 'All Statuses' ? statusFilter : undefined;

      const priority =
        priorityFilter !== 'All Priorities' ? priorityFilter : undefined;

      const response = await tasksAPI.getAll(priority, status);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const newTask = {
        title,
        description,
        priority,
        due_date: dueDate || null,
        status: 'Todo',
      };

      const response = await tasksAPI.create(newTask);

      if (response.data) {
        setTasks([response.data, ...tasks]);
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setDueDate('');
        alert('Task created successfully!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  // Update task
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const response = await tasksAPI.update(taskId, updateData);

      if (response.data) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: newStatus as any,
                  completed_at: updateData.completed_at,
                }
              : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter((task) => task.id !== taskId));
      alert('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getStatusButton = (task: Task) => {
    switch (task.status) {
      case 'Todo':
        return (
          <button
            onClick={() => updateTaskStatus(task.id, 'In-Progress')}
            className="btn btn-warning"
          >
            ▶ Mark In Progress
          </button>
        );
      case 'In-Progress':
        return (
          <button
            onClick={() => updateTaskStatus(task.id, 'Completed')}
            className="btn btn-success"
          >
            ✓ Mark Complete
          </button>
        );
      case 'Completed':
        return (
          <button
            onClick={() => updateTaskStatus(task.id, 'Todo')}
            className="btn btn-secondary"
          >
            ↺ Reopen
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* <header className="dashboard-header">
        <h1>📋 Task Management App</h1>
        <div className="header-actions">
          <button className="btn btn-info">📊 Analytics</button>
          <button onClick={handleLogout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </header> */}

      <div className="create-task-section">
        <h2>Create New Task</h2>
        <form onSubmit={handleCreateTask} className="task-form">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button type="submit">Create Task</button>
        </form>
      </div>

      <div className="tasks-section">
        {loading && <p>Loading...</p>}

        {!loading &&
          tasks.map((task) => (
  <div key={task.id} className="task-card">

    <div className="task-top">
      {/* LEFT SIDE */}
      <div className="task-left">
        <h3>{task.title}</h3>
        <p>{task.description}</p>
      </div>

      {/* RIGHT SIDE */}
      <div className="task-right">
        <p>📌 {task.priority}</p>
        <p>📊 {task.status}</p>

        {task.due_date && (
          <p>🗓 {new Date(task.due_date).toLocaleDateString()}</p>
        )}

        {task.completed_at && (
          <p>✅ {new Date(task.completed_at).toLocaleDateString()}</p>
        )}
      </div>
    </div>

    {/* BUTTONS */}
    <div className="task-actions-full">
      {getStatusButton(task)}
      <button onClick={() => deleteTask(task.id)}>Delete</button>
    </div>

  </div>
))}
      </div>
    </div>
  );
};

export default DashboardPage;