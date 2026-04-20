import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import { WorkspaceModel } from '../models/Workspace';

interface RequestWithUser extends Request {
  user?: { userId: string; email: string };
}

const resolveWorkspace = async (
  req: RequestWithUser,
  res: Response
): Promise<{ userId: string; workspaceId?: string } | null> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const workspaceId = req.query.workspace_id as string | undefined;

  if (workspaceId) {
    const isMember = await WorkspaceModel.isMember(workspaceId, req.user.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied: not a member of this workspace' });
      return null;
    }
    return { userId: req.user.userId, workspaceId };
  }

  return { userId: req.user.userId };
};

export const getDashboardStats = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const context = await resolveWorkspace(req, res);
    if (!context) return;

    const stats = await TaskModel.getStats(context.userId, context.workspaceId);
    const completionRate = stats.total > 0
      ? (stats.completed / stats.total * 100).toFixed(2)
      : 0;

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

export const getPriorityAnalytics = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const context = await resolveWorkspace(req, res);
    if (!context) return;

    const breakdown = await TaskModel.getPriorityBreakdown(context.userId, context.workspaceId);
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

export const getProductivityHeatmap = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const context = await resolveWorkspace(req, res);
    if (!context) return;

    const heatmapData = await TaskModel.getCompletionHeatmap(context.userId, context.workspaceId);
    res.json(heatmapData);
  } catch (error) {
    console.error('Get productivity heatmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
