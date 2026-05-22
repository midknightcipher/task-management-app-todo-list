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

// Replaces the old 'Priority' chart with the new Team Intelligence data
// We just pass the JSON directly from the ETL pipeline to the frontend
export const getTeamIntelligence = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workspaceId = req.query.workspace_id as string | undefined;
    
    if (!workspaceId) {
       // Return empty arrays if no workspace is selected so the UI doesn't crash
       res.json({ leaderboard: [], workload: [] });
       return;
    }

    const result = await pool.query(
      `SELECT leaderboard_data, workload_distribution 
       FROM workspace_daily_metrics 
       WHERE workspace_id = $1 
       ORDER BY updated_at DESC LIMIT 1`,
      [workspaceId]
    );

    const data = result.rows[0] || { leaderboard_data: [], workload_distribution: [] };
    
    res.json({
      leaderboard: data.leaderboard_data,
      workload: data.workload_distribution
    });
  } catch (error) {
    console.error('Get team intelligence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Exposes the Python background worker's health status for the new UI widget
export const getPipelineHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT status, rows_processed, run_end 
       FROM etl_pipeline_logs 
       ORDER BY run_end DESC LIMIT 1`
    );
    
    // Default to unknown if the pipeline hasn't run yet
    res.json(result.rows[0] || { status: 'unknown', rows_processed: 0, run_end: null });
  } catch (error) {
    console.error('Get pipeline health error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Left this exactly as it was. It still uses the TaskModel for now since
// moving a complex 365-day heatmap to ETL is a bit overkill for this sprint.
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