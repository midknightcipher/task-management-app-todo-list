import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logs an activity entry in workspace_activity.
 * Called fire-and-forget via .catch(console.error) in controllers.
 */
export const logActivity = async (
  workspaceId: string,
  userId: string,
  action: string,
  taskId?: string
): Promise<void> => {
  await pool.query(
    `INSERT INTO workspace_activity (id, workspace_id, user_id, action, task_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [uuidv4(), workspaceId, userId, action, taskId ?? null]
  );
};
