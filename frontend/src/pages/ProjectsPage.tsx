import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchWorkspaces, createWorkspace, deleteWorkspace } from '../store/slices/workspaceSlice';
import { fetchTasks, createTask, updateTask, toggleTask } from '../store/slices/taskSlice';
import { workspaceAPI } from '../services/api';
import { Workspace, Task, WorkspaceMember } from '../types';
import { authService } from '../services/auth';
import AppLayout from '../components/AppLayout';
import './Pages.css';

const IconFolder = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconCheckCircle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconCircle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = authService.getUser();
  
  const { workspaces, status: wsStatus } = useAppSelector((state) => state.workspaces);
  const { items: allTasks, status: tasksStatus } = useAppSelector((state) => state.tasks);

  const [view, setView] = useState<'grid' | 'detail'>('grid');
  const [selectedProject, setSelectedProject] = useState<Workspace | null>(null);
  const [projectMembers, setProjectMembers] = useState<WorkspaceMember[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'Low'|'Medium'|'High'>('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const projectTasks = allTasks.filter(t => t.workspace_id === selectedProject?.id);

  useEffect(() => {
    if (wsStatus === 'idle') dispatch(fetchWorkspaces());
    if (tasksStatus === 'idle') dispatch(fetchTasks());
  }, [dispatch, wsStatus, tasksStatus]);

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(createWorkspace(newProjectName));
    setIsCreateModalOpen(false);
    setNewProjectName('');
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (window.confirm("Delete this project and all its tasks permanently?")) {
      dispatch(deleteWorkspace(id));
    }
  };

  const openProject = async (ws: Workspace) => {
    setSelectedProject(ws);
    setView('detail');
    setShowTaskForm(false);
    try {
      const membersRes = await workspaceAPI.getMembers(ws.id);
      setProjectMembers(membersRes.data || []);
    } catch (err) { console.error("Failed to load members", err); }
  };

  const handleCreateProjectTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    await dispatch(createTask({ title: taskTitle, description: taskDescription, priority: taskPriority, status: 'Todo', due_date: taskDueDate || null, workspace_id: selectedProject.id, assignee_email: taskAssignee || null }));
    setShowTaskForm(false);
    setTaskTitle(''); setTaskDescription(''); setTaskPriority('Medium'); setTaskDueDate(''); setTaskAssignee('');
  };

  if (view === 'detail' && selectedProject) {
    const isOwner = selectedProject.my_role === 'owner';
    return (
      <AppLayout>
        <div className="pg__container">
          <div className="pg__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: showTaskForm ? '0' : '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
              <button className="pg__btn-outline" onClick={() => { setSelectedProject(null); setView('grid'); }} style={{ padding: '6px 12px', fontSize: '13px' }}>
                <IconArrowLeft /> Back to Projects
              </button>
              <div><h1 className="pg__title">{selectedProject.name}</h1><p className="pg__subtitle">Manage tasks and assignments for this specific project</p></div>
            </div>
            {isOwner && <div className="pg__header-actions"><button className="pg__btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}><IconPlus /> {showTaskForm ? 'Cancel' : 'Add Task'}</button></div>}
          </div>

          {showTaskForm && (
            <div className="inline-task-form" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', margin: '24px 0 32px 0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Add Task to {selectedProject.name}</h2>
              <form onSubmit={handleCreateProjectTask}>
                <div className="input-group"><label>Task Title</label><input type="text" placeholder="What needs to be done?" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required /></div>
                <div className="input-group"><label>Description (optional)</label><textarea placeholder="Add details or context..." value={taskDescription} onChange={e => setTaskDescription(e.target.value)} rows={2} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group"><label>Priority</label><select value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                  <div className="input-group"><label>Due Date</label><input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} /></div>
                </div>
                <div className="input-group">
                  <label>Assign To (Optional)</label>
                  <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => <option key={m.user_id} value={m.email}>{m.email.split('@')[0]} {m.email === currentUser?.email ? '(You)' : ''}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}><button type="submit" className="pg__btn-primary">Save Task</button></div>
              </form>
            </div>
          )}

          <div className="table-container">
            <table className="task-table">
              <thead><tr><th>TASK</th><th>ASSIGNED TO</th><th>DATES</th><th>STATUS</th><th>PRIORITY</th></tr></thead>
              <tbody>
                {projectTasks.length === 0 && <tr><td colSpan={5} className="text-muted" style={{padding: '40px', textAlign: 'center'}}>No tasks exist in this project yet. Add one above!</td></tr>}
                {projectTasks.map(task => (
                  <tr key={task.id}>
                    <td className="fw-600">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => dispatch(toggleTask(task.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                          {task.status === 'Completed' ? <IconCheckCircle /> : <IconCircle />}
                        </button>
                        <span style={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? '#94a3b8' : '#0f172a' }}>{task.title}</span>
                      </div>
                    </td>
                    <td>
                      {isOwner ? (
                        <select value={task.assignee_email || ''} onChange={(e) => dispatch(updateTask({ id: task.id, data: { assignee_email: e.target.value || null } }))} style={{ border: '1px solid transparent', outline: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', background: '#f8fafc', color: '#334155', fontWeight: 500 }}>
                          <option value="">Unassigned</option>
                          {projectMembers.map(m => <option key={m.user_id} value={m.email}>{m.email.split('@')[0]} {m.email === currentUser?.email ? '(You)' : ''}</option>)}
                        </select>
                      ) : <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{task.assignee_email ? task.assignee_email.split('@')[0] : 'Unassigned'}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Created: {formatDate(task.created_at)}</span>
                        {task.due_date && <span style={{ fontSize: '11.5px', color: isOverdue(task.due_date, task.status) ? '#ef4444' : '#64748b', fontWeight: isOverdue(task.due_date, task.status) ? 600 : 400 }}>Due: {formatDate(task.due_date)} {isOverdue(task.due_date, task.status) && '(Overdue)'}</span>}
                        {task.completed_at && <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600 }}>Done: {formatDate(task.completed_at)}</span>}
                      </div>
                    </td>
                    <td>
                      <select value={task.status} onChange={(e) => dispatch(updateTask({ id: task.id, data: { status: e.target.value as any, completed_at: e.target.value === 'Completed' ? new Date().toISOString() : null } }))} className={`badge-status ${task.status.toLowerCase().replace(' ', '-')}`} style={{ border: '1px solid transparent', outline: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', appearance: 'none', textAlign: 'center' }}>
                        <option value="Todo">Todo</option><option value="In-Progress">In Progress</option><option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td><span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pg__container">
        <div className="pg__header">
          <div><h1 className="pg__title">Projects</h1><p className="pg__subtitle">Manage your team projects and access</p></div>
          <div className="pg__header-actions"><button className="pg__btn-primary" onClick={() => setIsCreateModalOpen(true)}><IconPlus /> New Project</button></div>
        </div>
        {wsStatus === 'loading' ? (<div style={{ color: '#64748b' }}>Loading projects...</div>) : workspaces.length === 0 ? (<div className="text-muted">No projects found. Create one to get started!</div>) : (
          <div className="pg__grid">
            {workspaces.map(ws => (
              <div key={ws.id} className="proj-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => openProject(ws)}>
                <div className="proj-card__top" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="proj-card__icon" style={{ width: '40px', height: '40px' }}><IconFolder /></div>
                    <div className="proj-card__info"><h3 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>{ws.name}</h3><span className="badge badge-active" style={{ fontSize: '10px' }}>Active</span></div>
                  </div>
                  {ws.my_role === 'owner' && <button className="icon-btn" onClick={(e) => handleDeleteProject(e, ws.id)}><IconTrash /></button>}
                </div>
                <div className="proj-card__bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ color: '#64748b' }}>Role: <span style={{ fontWeight: 600, color: '#0f172a' }}>{ws.my_role}</span></span><span style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: 500 }}>View Tasks →</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {isCreateModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header"><h2>Create New Project</h2><button className="icon-btn" onClick={() => setIsCreateModalOpen(false)}><IconX /></button></div>
              <form onSubmit={handleCreateProject}>
                <div className="input-group"><label>Project Name</label><input type="text" placeholder="e.g. Website Redesign" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required /></div>
                <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => setIsCreateModalOpen(false)}>Cancel</button><button type="submit" className="btn-submit">Create Project</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;