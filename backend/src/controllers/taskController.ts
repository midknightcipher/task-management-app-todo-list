import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import { WorkspaceModel } from '../models/Workspace';
import { ActivityLogModel } from '../models/ActivityLog';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const requireWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  res: Response
): Promise<boolean> => {
  const isMember = await WorkspaceModel.isMember(workspaceId, userId);
  if (!isMember) {
    res.status(403).json({ error: 'Access denied: not a member of this workspace' });
    return false;
  }
  return true;
};

export const createTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { workspace_id } = req.body;
    if (!workspace_id) {
      res.status(400).json({ error: 'workspace_id is required' });
      return;
    }

    const allowed = await requireWorkspaceMember(workspace_id, req.user.userId, res);
    if (!allowed) return;

    const task = await TaskModel.create(req.user.userId, req.body);
    if (!task) {
      res.status(500).json({ error: 'Failed to create task' });
      return;
    }

    // Log activity
    await ActivityLogModel.log({
      workspace_id,
      task_id: task.id,
      user_id: req.user.userId,
      action: 'task_created',
      meta: { title: task.title },
    });

    if (task.assigned_to) {
      await ActivityLogModel.log({
        workspace_id,
        task_id: task.id,
        user_id: req.user.userId,
        action: 'task_assigned',
        meta: { assigned_to: task.assigned_to, assigned_email: task.assigned_email },
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTasks = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { priority, status, workspace_id } = req.query;

    if (!workspace_id) {
      res.status(400).json({ error: 'workspace_id query parameter is required' });
      return;
    }

    const allowed = await requireWorkspaceMember(workspace_id as string, req.user.userId, res);
    if (!allowed) return;

    const tasks = await TaskModel.findByWorkspaceId(workspace_id as string, {
      priority: priority as string | undefined,
      status: status as string | undefined,
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskById = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const task = await TaskModel.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const allowed = await requireWorkspaceMember(task.workspace_id!, req.user.userId, res);
    if (!allowed) return;

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const task = await TaskModel.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const allowed = await requireWorkspaceMember(task.workspace_id!, req.user.userId, res);
    if (!allowed) return;

    const prevStatus = task.status;
    const prevAssignedTo = task.assigned_to;

    const updatedTask = await TaskModel.update(req.params.id, req.body);
    if (!updatedTask) {
      res.status(500).json({ error: 'Failed to update task' });
      return;
    }

    // Log: general update
    await ActivityLogModel.log({
      workspace_id: task.workspace_id!,
      task_id: task.id,
      user_id: req.user.userId,
      action: 'task_updated',
      meta: { fields: Object.keys(req.body) },
    });

    // Log: status change
    if (req.body.status && req.body.status !== prevStatus) {
      await ActivityLogModel.log({
        workspace_id: task.workspace_id!,
        task_id: task.id,
        user_id: req.user.userId,
        action: 'status_changed',
        meta: { from: prevStatus, to: req.body.status },
      });
    }

    // Log: assignment change
    if ('assigned_to' in req.body && req.body.assigned_to !== prevAssignedTo) {
      await ActivityLogModel.log({
        workspace_id: task.workspace_id!,
        task_id: task.id,
        user_id: req.user.userId,
        action: 'task_assigned',
        meta: {
          assigned_to: req.body.assigned_to,
          assigned_email: updatedTask.assigned_email,
        },
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const task = await TaskModel.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const allowed = await requireWorkspaceMember(task.workspace_id!, req.user.userId, res);
    if (!allowed) return;

    // Log before deleting (task_id will become dangling but cascade handles it)
    await ActivityLogModel.log({
      workspace_id: task.workspace_id!,
      task_id: null,
      user_id: req.user.userId,
      action: 'task_deleted',
      meta: { title: task.title },
    });

    const deleted = await TaskModel.delete(req.params.id);
    if (!deleted) {
      res.status(500).json({ error: 'Failed to delete task' });
      return;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleTaskCompletion = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const task = await TaskModel.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const allowed = await requireWorkspaceMember(task.workspace_id!, req.user.userId, res);
    if (!allowed) return;

    const isCompleted = task.status === 'Completed';
    const newStatus = isCompleted ? 'Todo' : 'Completed';

    const updatedTask = await TaskModel.update(req.params.id, {
      status: newStatus,
      completed_at: isCompleted ? null : new Date(),
    });

    if (!updatedTask) {
      res.status(500).json({ error: 'Failed to update task' });
      return;
    }

    await ActivityLogModel.log({
      workspace_id: task.workspace_id!,
      task_id: task.id,
      user_id: req.user.userId,
      action: 'status_changed',
      meta: { from: task.status, to: newStatus },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
