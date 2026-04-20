import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  // joined
  user_email?: string;
}

export class CommentModel {
  static async create(
    taskId: string,
    userId: string,
    content: string
  ): Promise<Comment | null> {
    try {
      const result = await pool.query(
        `INSERT INTO comments (id, task_id, user_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [uuidv4(), taskId, userId, content.trim()]
      );

      if (!result.rows[0]) return null;
      return await CommentModel.findById(result.rows[0].id);
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  }

  static async findById(commentId: string): Promise<Comment | null> {
    try {
      const result = await pool.query(
        `SELECT c.*, u.email AS user_email
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = $1`,
        [commentId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding comment:', error);
      return null;
    }
  }

  static async findByTask(taskId: string): Promise<Comment[]> {
    try {
      const result = await pool.query(
        `SELECT c.*, u.email AS user_email
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.task_id = $1
         ORDER BY c.created_at ASC`,
        [taskId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding comments:', error);
      return [];
    }
  }

  static async delete(commentId: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM comments WHERE id = $1 AND user_id = $2`,
        [commentId, userId]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }
}
