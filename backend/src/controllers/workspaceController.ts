import { Request, Response } from 'express';
import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const getMember = async (workspaceId: string, userId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );
  return rows[0] ?? null;
};

// POST /workspaces
export const createWorkspace = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { name } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: 'Workspace name is required' }); return; }

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO workspaces (id, name, owner_id) VALUES ($1, $2, $3) RETURNING *`,
      [id, name.trim(), req.user.userId]
    );

    await pool.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
      [uuidv4(), id, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /workspaces
export const listWorkspaces = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { rows } = await pool.query(
      `SELECT w.*, wm.role AS my_role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('List workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /workspaces/:id
export const getWorkspace = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const member = await getMember(req.params.id, req.user.userId);
    if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

    const { rows } = await pool.query(
      `SELECT w.*, $2::text AS my_role FROM workspaces w WHERE w.id = $1`,
      [req.params.id, member.role]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Workspace not found' }); return; }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /workspaces/:id/members
export const listMembers = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const member = await getMember(req.params.id, req.user.userId);
    if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

    const { rows } = await pool.query(
      `SELECT wm.id, wm.role, wm.joined_at, u.id AS user_id, u.email
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = $1
       ORDER BY wm.joined_at ASC`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /workspaces/:id/invite
export const inviteMember = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { id } = req.params;
    const { email } = req.body;

    const requester = await getMember(id, req.user.userId);
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      res.status(403).json({ error: 'Only owner or admin can invite members' });
      return;
    }

    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1`, [email]
    );
    if (!userRows[0]) { res.status(404).json({ error: 'User not found' }); return; }

    const existing = await getMember(id, userRows[0].id);
    if (existing) { res.status(409).json({ error: 'User is already a member' }); return; }

    await pool.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'member')`,
      [uuidv4(), id, userRows[0].id]
    );

    res.json({ message: 'Member invited successfully' });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /workspaces/:id/members/:memberId
export const removeMember = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { id, memberId } = req.params;

    const requester = await getMember(id, req.user.userId);
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      res.status(403).json({ error: 'Only owner or admin can remove members' });
      return;
    }

    const { rows } = await pool.query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [id, memberId]
    );
    if (!rows[0]) { res.status(404).json({ error: 'Member not found' }); return; }
    if (rows[0].role === 'owner') {
      res.status(400).json({ error: 'Cannot remove workspace owner' });
      return;
    }

    await pool.query(
      `DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [id, memberId]
    );

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /workspaces/:id/activity
export const getActivity = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const member = await getMember(req.params.id, req.user.userId);
    if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

    const { rows } = await pool.query(
      `SELECT wa.*, u.email AS user_email, t.title AS task_title
       FROM workspace_activity wa
       JOIN users u ON u.id = wa.user_id
       LEFT JOIN tasks t ON t.id = wa.task_id
       WHERE wa.workspace_id = $1
       ORDER BY wa.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ ADDED: DELETE /workspaces/:id
export const deleteWorkspace = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { id } = req.params;
    
    // Check if user is the owner
    const requester = await getMember(id, req.user.userId);
    if (!requester || requester.role !== 'owner') {
      res.status(403).json({ error: 'Only the project owner can delete this workspace' });
      return;
    }

    // Because of your 'ON DELETE CASCADE' in init.sql, deleting this row 
    // automatically deletes all attached members, tasks, and activity logs!
    await pool.query(`DELETE FROM workspaces WHERE id = $1`, [id]);

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};