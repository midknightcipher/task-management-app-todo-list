import { Request, Response } from 'express';
import pool from '../utils/db';

export const getKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         COUNT(*) FILTER (WHERE status = 'Completed') as completed_tasks,
         COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'Completed') as overdue_tasks
       FROM tasks 
       WHERE user_id = $1 AND workspace_id IS NULL`,
      [req.user.userId]
    );

    const total = parseInt(result.rows[0].total_tasks || '0', 10);
    const completed = parseInt(result.rows[0].completed_tasks || '0', 10);
    const overdue = parseInt(result.rows[0].overdue_tasks || '0', 10);
    const completionRate = total === 0 ? 0 : Number((completed / total).toFixed(4));

    res.json({ total_tasks: total, completed_tasks: completed, overdue_tasks: overdue, completion_rate: completionRate });
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWorkspaceKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { workspaceId } = req.params;

    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         COUNT(*) FILTER (WHERE status = 'Completed') as completed_tasks,
         COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'Completed') as overdue_tasks
       FROM tasks 
       WHERE workspace_id = $1`,
      [workspaceId]
    );

    const total = parseInt(result.rows[0].total_tasks || '0', 10);
    const completed = parseInt(result.rows[0].completed_tasks || '0', 10);
    const overdue = parseInt(result.rows[0].overdue_tasks || '0', 10);
    const completionRate = total === 0 ? 0 : Number((completed / total).toFixed(4));

    res.json({ total_tasks: total, completed_tasks: completed, overdue_tasks: overdue, completion_rate: completionRate });
  } catch (error) {
    console.error('Get Workspace KPIs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const range = req.query.range as string || '30d';
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const workspaceId = req.query.workspace_id as string | undefined;

    let query = '';
    let params: any[] = [];

    if (workspaceId) {
      query = `
        SELECT metric_date as date, total_tasks as tasks_created, completed_tasks as tasks_completed, workspace_health_score as productivity_score
        FROM workspace_daily_metrics 
        WHERE workspace_id = $1 AND metric_date >= CURRENT_DATE - $2::int
        ORDER BY metric_date ASC
      `;
      params = [workspaceId, days];
    } else {
      query = `
        SELECT metric_date as date, tasks_created, tasks_completed, productivity_score
        FROM user_daily_metrics 
        WHERE user_id = $1 AND metric_date >= CURRENT_DATE - $2::int
        ORDER BY metric_date ASC
      `;
      params = [req.user.userId, days];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHeatmap = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const workspaceId = req.query.workspace_id as string | undefined;

    let query = '';
    let params: any[] = [];

    if (workspaceId) {
      query = `
        SELECT TO_CHAR(metric_date, 'YYYY-MM-DD') as date, completed_tasks as count
        FROM workspace_daily_metrics 
        WHERE workspace_id = $1 AND EXTRACT(YEAR FROM metric_date) = $2
        ORDER BY metric_date ASC
      `;
      params = [workspaceId, year];
    } else {
      query = `
        SELECT TO_CHAR(metric_date, 'YYYY-MM-DD') as date, tasks_completed as count
        FROM user_daily_metrics 
        WHERE user_id = $1 AND EXTRACT(YEAR FROM metric_date) = $2
        ORDER BY metric_date ASC
      `;
      params = [req.user.userId, year];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActionRadar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workspaceId = req.query.workspace_id as string | undefined;
    const userId = req.user.userId;

    let urgentQuery = '';
    let staleQuery = '';
    let queryParams: any[] = [];

    if (workspaceId) {
      urgentQuery = `
        SELECT id, title, due_date 
        FROM tasks 
        WHERE workspace_id = $1 
          AND status != 'Completed' 
          AND due_date IS NOT NULL
          AND due_date <= NOW() + INTERVAL '48 hours'
        ORDER BY due_date ASC
        LIMIT 10;
      `;
      staleQuery = `
        SELECT id, title, updated_at 
        FROM tasks 
        WHERE workspace_id = $1 
          AND status != 'Completed' 
          AND updated_at <= NOW() - INTERVAL '7 days'
        ORDER BY updated_at ASC
        LIMIT 10;
      `;
      queryParams = [workspaceId];
    } else {
      urgentQuery = `
        SELECT id, title, due_date 
        FROM tasks 
        WHERE user_id = $1 
          AND workspace_id IS NULL
          AND status != 'Completed' 
          AND due_date IS NOT NULL
          AND due_date <= NOW() + INTERVAL '48 hours'
        ORDER BY due_date ASC
        LIMIT 10;
      `;
      staleQuery = `
        SELECT id, title, updated_at 
        FROM tasks 
        WHERE user_id = $1 
          AND workspace_id IS NULL
          AND status != 'Completed' 
          AND updated_at <= NOW() - INTERVAL '7 days'
        ORDER BY updated_at ASC
        LIMIT 10;
      `;
      queryParams = [userId];
    }

    const [urgentResult, staleResult] = await Promise.all([
      pool.query(urgentQuery, queryParams),
      pool.query(staleQuery, queryParams)
    ]);

    res.json({
      urgent: urgentResult.rows,
      stale: staleResult.rows
    });

  } catch (error) {
    console.error('Get action radar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};