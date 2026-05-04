import { Request, Response } from 'express';
import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const createWorkspace = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = req.body;

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO workspaces (id, name, owner_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, name, req.user.userId]
    );

    // also add owner as member
    await pool.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role)
       VALUES ($1, $2, $3, 'owner')`,
      [uuidv4(), id, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};