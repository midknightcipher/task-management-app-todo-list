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