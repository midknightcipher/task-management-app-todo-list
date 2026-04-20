import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLog {
  id: string;
  workspace_id: string;
  task_id: string | null;
  user_id: string;
  action: string;
  meta: Record<string, any> | null;
  created_at: Date;
  // joined
  user_email?: string;
  task_title?: string;
}

export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'status_changed'
  | 'task_assigned'
  | 'task_deleted'
  | 'comment_added';

export class ActivityLogModel {
  static async log(params: {
    workspace_id: string;
    task_id: string | null;
    user_id: string;
    action: ActivityAction;
    meta?: Record<string, any>;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO activity_logs (id, workspace_id, task_id, user_id, action, meta)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          params.workspace_id,
          params.task_id ?? null,
          params.user_id,
          params.action,
          params.meta ? JSON.stringify(params.meta) : null,
        ]
      );
    } catch (error) {
      // Non-critical — log but do not throw
      console.error('Activity log error:', error);
    }
  }

  static async findByWorkspace(
    workspaceId: string,
    limit: number = 50
  ): Promise<ActivityLog[]> {
    try {
      const result = await pool.query(
        `SELECT al.*, u.email AS user_email, t.title AS task_title
         FROM activity_logs al
         JOIN users u ON al.user_id = u.id
         LEFT JOIN tasks t ON al.task_id = t.id
         WHERE al.workspace_id = $1
         ORDER BY al.created_at DESC
         LIMIT $2`,
        [workspaceId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  }

  static async findByTask(taskId: string): Promise<ActivityLog[]> {
    try {
      const result = await pool.query(
        `SELECT al.*, u.email AS user_email
         FROM activity_logs al
         JOIN users u ON al.user_id = u.id
         WHERE al.task_id = $1
         ORDER BY al.created_at DESC`,
        [taskId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching task activity logs:', error);
      return [];
    }
  }
}
