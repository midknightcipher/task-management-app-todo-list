import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI, workspaceAPI } from '../services/api';
import { Task, Workspace } from '../types';
import './Pages.css';

// SVG Icons
const IconFolder = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCircle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
const IconCheckCircle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const AllTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  // Edit Modal State (Status removed since it's inline now)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'Low'|'Medium'|'High'>('Medium');
  const [editDueDate, setEditDueDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, wsRes] = await Promise.all([tasksAPI.getAll(), workspaceAPI.getAll()]);
      setTasks(tasksRes.data || []);
      setWorkspaces(wsRes.data || []);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getWorkspaceName = (id: string | null | undefined) => {
    if (!id) return 'Personal Task';
    const ws = workspaces.find(w => w.id === id);
    return ws ? ws.name : 'Unknown';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate?: string | null, status?: string) => {
    if (!dueDate || status === 'Completed') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    return due < today;
  };

  // ✅ ROLE CHECK: Only owners/admins can edit or delete project tasks
  const canEditTask = (task: Task) => {
    if (!task.workspace_id) return true; // It's a personal task, full access
    const ws = workspaces.find(w => w.id === task.workspace_id);
    return ws && (ws.my_role === 'owner' || ws.my_role === 'admin');
  };

  // --- Actions ---
  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await tasksAPI.update(task.id, { 
        status: newStatus as any,
        completed_at: newStatus === 'Completed' ? new Date().toISOString() : null
      });
      fetchData(); 
    } catch (err) { alert("Failed to update status"); }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Are you sure you want to delete this task permanently?")) {
      await tasksAPI.delete(id);
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const openEditModal = (task: Task) => {
    setEditTaskId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasksAPI.update(editTaskId, { 
        title: editTitle, 
        priority: editPriority,
        due_date: editDueDate || null
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to update task");
    }
  };

  return (
    <div className="pg__container">
      <div className="pg__header">
        <div>
          <h1 className="pg__title">All Tasks</h1>
          <p className="pg__subtitle">Every task across all your projects and personal lists</p>
        </div>
      </div>

      <div className="table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>TASK</th>
              <th>ASSIGNED TO</th>
              <th>DATES</th>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && <tr><td colSpan={6} className="text-muted">No tasks found.</td></tr>}
            {tasks.map(task => (
              <tr key={task.id}>
                
                {/* ✅ Merged Task Title & Location */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="fw-600" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {task.status === 'Completed' ? <IconCheckCircle /> : <IconCircle />}
                      <span style={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? '#94a3b8' : '#0f172a' }}>
                        {task.title}
                      </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '11.5px', paddingLeft: '24px' }}>
                      <IconFolder /> {getWorkspaceName(task.workspace_id)}
                    </div>
                  </div>
                </td>
                
                {/* ✅ New Assigned To Column */}
                <td>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                    {!task.workspace_id ? 'Self' : (task.assignee_email ? task.assignee_email.split('@')[0] : 'Unassigned')}
                  </span>
                </td>
                
                {/* Timestamps & Overdue Check */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Created: {formatDate(task.created_at)}</span>
                    {task.due_date && (
                      <span style={{ fontSize: '11.5px', color: isOverdue(task.due_date, task.status) ? '#ef4444' : '#64748b', fontWeight: isOverdue(task.due_date, task.status) ? 600 : 400 }}>
                        Due: {formatDate(task.due_date)} {isOverdue(task.due_date, task.status) && '(Overdue)'}
                      </span>
                    )}
                    {task.completed_at && (
                      <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600 }}>Done: {formatDate(task.completed_at)}</span>
                    )}
                  </div>
                </td>

                {/* ✅ Inline Status Dropdown */}
                <td>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                    className={`badge-status ${task.status.toLowerCase().replace(' ', '-')}`}
                    style={{ border: '1px solid transparent', outline: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', appearance: 'none', textAlign: 'center' }}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In-Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                
                <td><span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                
                {/* ✅ Role-Based Actions */}
                <td>
                  {canEditTask(task) ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" title="Edit Task" onClick={() => openEditModal(task)}><IconEdit /></button>
                      <button className="icon-btn" title="Delete Task" onClick={() => handleDelete(task.id)}><IconTrash /></button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Member</span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── EDIT TASK MODAL ── */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Task</h2>
              <button className="icon-btn" onClick={() => setIsEditModalOpen(false)}><IconX /></button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="input-group">
                <label>Task Title</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Due Date</label>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AllTasksPage;