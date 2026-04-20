import { Request, Response } from 'express';
import { ActivityLogModel } from '../models/ActivityLog';
import { WorkspaceModel } from '../models/Workspace';
import { TaskModel } from '../models/Task';

interface RequestWithUser extends Request {
  user?: { userId: string; email: string };
}

export const getWorkspaceActivity = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      res.status(400).json({ error: 'workspaceId is required' });
      return;
    }

    const isMember = await WorkspaceModel.isMember(workspaceId, req.user.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const logs = await ActivityLogModel.findByWorkspace(workspaceId, limit);
    res.json(logs);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskActivity = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const taskId = req.query.taskId as string;
    if (!taskId) {
      res.status(400).json({ error: 'taskId is required' });
      return;
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isMember = await WorkspaceModel.isMember(task.workspace_id!, req.user.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const logs = await ActivityLogModel.findByTask(taskId);
    res.json(logs);
  } catch (error) {
    console.error('Get task activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
