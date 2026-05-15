import React, { useEffect, useState } from 'react';
import { workspaceAPI } from '../services/api';
import { Workspace, WorkspaceMember } from '../types';
import { authService } from '../services/auth';
import './Pages.css';

const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconFolder = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconUserPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

interface ExtendedMember extends WorkspaceMember {
  workspace_id: string;
  workspace_name: string;
  my_role_in_workspace: string; 
}

// Helper interface for our new grouped data structure
interface GroupedMember {
  email: string;
  user_id: string;
  projects: {
    workspace_id: string;
    workspace_name: string;
    role: string;
    my_role_in_workspace: string;
  }[];
}

const TeamPage: React.FC = () => {
  const currentUser = authService.getUser();
  const [members, setMembers] = useState<ExtendedMember[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorLog, setErrorLog] = useState('');

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState('');

  const fetchTeamData = async () => {
    setLoading(true);
    setErrorLog('');
    try {
      const wsRes = await workspaceAPI.getAll();
      const loadedWorkspaces = wsRes.data || [];
      setWorkspaces(loadedWorkspaces);

      if (loadedWorkspaces.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const memberPromises = loadedWorkspaces.map(ws =>
        workspaceAPI.getMembers(ws.id)
          .then(res => ({ ws, membersData: res.data || [], error: null }))
          .catch(err => ({ ws, membersData: [], error: err.message })) 
      );

      const results = await Promise.all(memberPromises);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        setErrorLog("Could not fetch some team members. Is your backend server running?");
      }

      let allMembers: ExtendedMember[] = [];
      results.forEach(({ ws, membersData }) => {
        const mapped = membersData.map((m: any) => ({
          ...m,
          workspace_id: ws.id,
          workspace_name: ws.name,
          my_role_in_workspace: ws.my_role
        }));
        allMembers = [...allMembers, ...mapped];
      });

      setMembers(allMembers);
    } catch (error) {
      setErrorLog("Network error. Please make sure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleRemoveMember = async (workspaceId: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove ${email} from this project?`)) {
      try {
        const memberObj = members.find(m => m.workspace_id === workspaceId && m.email === email);
        if(memberObj) {
          await workspaceAPI.removeMember(workspaceId, memberObj.user_id);
          fetchTeamData(); 
        }
      } catch {
        alert("Failed to remove member. You might not have permission.");
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workspaceAPI.invite(inviteWorkspaceId, inviteEmail);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteWorkspaceId('');
      fetchTeamData(); 
      alert(`Successfully invited ${inviteEmail}!`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to invite user. Make sure they have registered an account.");
    }
  };

  // ✅ GROUPING LOGIC: Combine duplicate users into a single object
  const groupedMembers = Object.values(members.reduce((acc, m) => {
    if (!acc[m.email]) {
      acc[m.email] = { email: m.email, user_id: m.user_id, projects: [] };
    }
    acc[m.email].projects.push({
      workspace_id: m.workspace_id,
      workspace_name: m.workspace_name,
      role: m.role,
      my_role_in_workspace: m.my_role_in_workspace
    });
    return acc;
  }, {} as Record<string, GroupedMember>));

  return (
    <div className="pg__container">
      <div className="pg__header">
        <div>
          <h1 className="pg__title">Team Directory</h1>
          <p className="pg__subtitle">Manage project access for all members</p>
        </div>
        <div className="pg__header-actions">
          <button className="pg__btn-primary" onClick={() => setIsInviteModalOpen(true)}>
            <IconUserPlus /> Invite Member
          </button>
        </div>
      </div>

      {errorLog && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', fontWeight: 500 }}>
          ⚠️ {errorLog}
        </div>
      )}

      <div className="table-container">
        {/* We reduced the columns to 2 to give the project list plenty of room */}
        <table className="task-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>TEAM MEMBER</th>
              <th>ASSIGNED PROJECTS & ACCESS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading team data...
                </td>
              </tr>
            ) : groupedMembers.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-muted" style={{ padding: '40px', textAlign: 'center' }}>
                  No team members found. Click "Invite Member" to add someone to a project!
                </td>
              </tr>
            ) : (
              groupedMembers.map((member, idx) => {
                const isMe = currentUser?.email === member.email;

                return (
                  <tr key={`${member.user_id}-${idx}`}>
                    
                    {/* Column 1: Member Email & Avatar */}
                    <td style={{ verticalAlign: 'top', paddingTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isMe ? '#f0fdf4' : '#f0f9ff', border: isMe ? '1px solid #bbf7d0' : '1px solid #bae6fd', color: isMe ? '#16a34a' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-600" style={{ fontSize: '14.5px' }}>
                          {member.email} {isMe && <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>(You)</span>}
                        </span>
                      </div>
                    </td>
                    
                    {/* Column 2: Stacked List of Projects */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {member.projects.map(proj => (
                          <div key={proj.workspace_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '8px' }}>
                            
                            {/* Project Name and Role Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 500, fontSize: '13.5px' }}>
                                <IconFolder /> {proj.workspace_name}
                              </div>
                              <span className={`badge ${proj.role === 'owner' ? 'badge-high' : proj.role === 'admin' ? 'badge-medium' : 'badge-active'}`}>
                                {proj.role.toUpperCase()}
                              </span>
                            </div>

                            {/* Project-Specific Remove Button */}
                            <div>
                              {!isMe && (proj.my_role_in_workspace === 'owner' || proj.my_role_in_workspace === 'admin') && proj.role !== 'owner' ? (
                                <button className="icon-btn" title={`Remove from ${proj.workspace_name}`} onClick={() => handleRemoveMember(proj.workspace_id, member.email)}>
                                  <IconTrash />
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>No actions</span>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                    </td>
                    
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── INVITE MEMBER MODAL ── */}
      {isInviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Invite Team Member</h2>
              <button className="icon-btn" onClick={() => setIsInviteModalOpen(false)}><IconX /></button>
            </div>
            <form onSubmit={handleInvite}>
              
              <div className="input-group">
                <label>User's Email Address</label>
                <input 
                  type="email" 
                  placeholder="colleague@company.com" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  required 
                />
                <span style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>
                  User must already have an account created on TaskPilot.
                </span>
              </div>

              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Select Project</label>
                <select 
                  value={inviteWorkspaceId} 
                  onChange={e => setInviteWorkspaceId(e.target.value)} 
                  required
                >
                  <option value="" disabled>Choose a project...</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsInviteModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamPage;