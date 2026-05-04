import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export const logActivity = async (
  workspaceId: string,
  userId: string,
  action: string,
  taskId?: string
) => {
  try {
    await pool.query(
      `INSERT INTO workspace_activity (id, workspace_id, user_id, action, task_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), workspaceId, userId, action, taskId || null]
    );
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

export const getWorkspaceActivity = async (
  workspaceId: string,
  limit = 50,
  offset = 0
) => {
  const { rows } = await pool.query(
    `SELECT * FROM workspace_activity
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [workspaceId, limit, offset]
  );

  return rows;
};