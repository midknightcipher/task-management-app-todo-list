import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stats = await TaskModel.getStats(req.user.userId);
    const completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(2) : 0;

    res.json({
      totalTasks: parseInt(stats.total),
      completedTasks: parseInt(stats.completed),
      pendingTasks: parseInt(stats.pending),
      overdueTasks: parseInt(stats.overdue),
      completionRate: parseFloat(completionRate as string),
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPriorityAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const breakdown = await TaskModel.getPriorityBreakdown(req.user.userId);
    const data = breakdown.map((item) => ({
      name: item.priority,
      value: parseInt(item.count),
    }));

    res.json(data);
  } catch (error) {
    console.error('Get priority analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductivityHeatmap = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const heatmapData = await TaskModel.getCompletionHeatmap(req.user.userId);
    res.json(heatmapData);
  } catch (error) {
    console.error('Get productivity heatmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};