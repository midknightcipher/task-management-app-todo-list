import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In-Progress' | 'Completed';
  due_date?: Date;
  completed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  workspace_id?: string | null;
}

export class TaskModel {
  static async create(userId: string, taskData: Partial<Task>): Promise<Task | null> {
    try {
      const id = uuidv4();
      const { title, description, priority, status, due_date } = taskData;

      const result = await pool.query(
        `INSERT INTO tasks (id, user_id, title, description, priority, status, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, userId, title, description || null, priority || 'Medium', status || 'Todo', due_date || null]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  static async findByUserId(userId: string, filters?: { priority?: string; status?: string }): Promise<Task[]> {
    try {
      let query = 'SELECT * FROM tasks WHERE user_id = $1';
      const params: any[] = [userId];

      if (filters?.priority) {
        query += ` AND priority = $${params.length + 1}`;
        params.push(filters.priority);
      }

      if (filters?.status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding tasks:', error);
      return [];
    }
  }

  static async findById(taskId: string): Promise<Task | null> {
    try {
      const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding task:', error);
      return null;
    }
  }

  static async update(taskId: string, updateData: Partial<Task>): Promise<Task | null> {
    try {
      const allowedFields = ['title', 'description', 'priority', 'status', 'due_date', 'completed_at'];
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (fields.length === 0) return null;

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      values.push(taskId);

      const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  static async delete(taskId: string): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      return result.rowCount! > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async getStats(userId: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status != 'Completed' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status != 'Completed' AND due_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue
        FROM tasks WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  static async getPriorityBreakdown(userId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = $1 GROUP BY priority`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting priority breakdown:', error);
      return [];
    }
  }

  static async getCompletionHeatmap(userId: string): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT 
        DATE(completed_at) as date,
        COUNT(*) as completed_count
      FROM tasks 
      WHERE user_id = $1 
        AND status = 'Completed'
        AND completed_at IS NOT NULL                 -- ✅ CRITICAL
        AND completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(completed_at)
      ORDER BY date ASC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting completion heatmap:', error);
    return [];
  }
}
}