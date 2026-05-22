import { Request, Response } from 'express';
import pool from '../utils/db';
import { TaskModel } from '../models/Task';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workspaceId = req.query.workspace_id as string | undefined;

    if (workspaceId) {
      // 1. Get current stats
      const result = await pool.query(
        `SELECT * FROM workspace_daily_metrics WHERE workspace_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [workspaceId]
      );
      const data = result.rows[0] || { total_tasks: 0, completed_tasks: 0, active_members: 0, overdue_tasks: 0, workspace_health_score: 100 };
      
      // 2. Get 7-day trend from pipeline
      const trendResult = await pool.query(
        `SELECT metric_date, completed_tasks as tasks_completed, total_tasks as tasks_created 
         FROM workspace_daily_metrics WHERE workspace_id = $1 ORDER BY metric_date DESC LIMIT 7`,
        [workspaceId]
      );
      
      const weeklyTrend = trendResult.rows.reverse().map(r => ({
        day: new Date(r.metric_date).toLocaleDateString('en-US', { weekday: 'short' }),
        completed: Number(r.tasks_completed),
        created: Number(r.tasks_created)
      }));

      res.json({
        mode: 'workspace',
        totalTasks: Number(data.total_tasks),
        completedTasks: Number(data.completed_tasks),
        overdueTasks: Number(data.overdue_tasks || 0),
        activeMembers: Number(data.active_members),
        healthScore: Number(data.workspace_health_score),
        weeklyTrend
      });
    } else {
      // 1. Get current personal stats
      const result = await pool.query(
        `SELECT * FROM user_daily_metrics WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [req.user.userId]
      );
      const data = result.rows[0] || { tasks_completed: 0, tasks_created: 0, overdue_tasks: 0, completion_rate: 0, productivity_score: 0 };
      
      // 2. Get 7-day trend from pipeline
      const trendResult = await pool.query(
        `SELECT metric_date, tasks_completed, tasks_created 
         FROM user_daily_metrics WHERE user_id = $1 ORDER BY metric_date DESC LIMIT 7`,
        [req.user.userId]
      );

      const weeklyTrend = trendResult.rows.reverse().map(r => ({
        day: new Date(r.metric_date).toLocaleDateString('en-US', { weekday: 'short' }),
        completed: Number(r.tasks_completed),
        created: Number(r.tasks_created)
      }));

      res.json({
        mode: 'personal',
        tasksCompleted: Number(data.tasks_completed),
        tasksCreated: Number(data.tasks_created),
        overdueTasks: Number(data.overdue_tasks || 0),
        completionRate: parseFloat(data.completion_rate),
        productivityScore: Number(data.productivity_score),
        weeklyTrend
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductivityHeatmap = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workspaceId = req.query.workspace_id as string | undefined;
    const heatmapData = await TaskModel.getCompletionHeatmap(req.user.userId, workspaceId);
    res.json(heatmapData);
  } catch (error) {
    console.error('Get productivity heatmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// New endpoint to power the "Action Radar" dashboard widget
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

    // Check if we are fetching for a Workspace or Personal tasks
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

    // Run both queries simultaneously for speed
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