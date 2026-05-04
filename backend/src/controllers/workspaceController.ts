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

export const createWorkspace = async (req: RequestWithUser, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { name } = req.body;
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO workspaces (id, name, owner_id) VALUES ($1,$2,$3) RETURNING *`,
    [id, name, req.user.userId]
  );

  await pool.query(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role)
     VALUES ($1,$2,$3,'owner')`,
    [uuidv4(), id, req.user.userId]
  );

  res.json(result.rows[0]);
};

export const listWorkspaces = async (req: RequestWithUser, res: Response) => {
  const { rows } = await pool.query(
    `SELECT w.* FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1`,
    [req.user!.userId]
  );

  res.json(rows);
};

export const inviteMember = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { email } = req.body;

  const requester = await getMember(id, req.user!.userId);
  if (!requester || requester.role !== 'owner') {
    return res.status(403).json({ error: 'Only owner can invite' });
  }

  const { rows } = await pool.query(`SELECT id FROM users WHERE email=$1`, [email]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });

  await pool.query(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role)
     VALUES ($1,$2,$3,'member')`,
    [uuidv4(), id, rows[0].id]
  );

  res.json({ message: 'Invited' });
};