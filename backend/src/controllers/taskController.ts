import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import pool from '../utils/db';
import { logActivity } from '../models/WorkspaceActivity';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const assertTaskAccess = async (taskId: string, userId: string): Promise<any | null | false> => {
  const task = await TaskModel.findById(taskId);
  if (!task) return null;

  if (!task.workspace_id) {
    return task.user_id === userId ? task : false;
  }

  const { rows } = await pool.query(
    `SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
    [task.workspace_id, userId]
  );

  return rows.length > 0 ? task : false;
};

// CREATE TASK
export const createTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { workspace_id } = req.body;

    if (workspace_id && typeof workspace_id !== 'string') {
      res.status(400).json({ error: 'Invalid workspace_id' });
      return;
    }

    if (workspace_id) {
      const { rows } = await pool.query(
        `SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
        [workspace_id, req.user.userId]
      );

      if (rows.length === 0) {
        res.status(403).json({ error: 'Not a member of this workspace' });
        return;
      }
    }

    const task = await TaskModel.create(req.user.userId, req.body);
    if (!task) { res.status(500).json({ error: 'Failed to create task' }); return; }

    if (task.workspace_id) {
      logActivity(task.workspace_id, req.user.userId, 'created_task', task.id).catch(console.error);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET TASKS
export const getTasks = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const { priority, status, workspace_id } = req.query;
    const workspaceId = workspace_id as string | undefined;

    if (workspaceId) {
      const { rows } = await pool.query(
        `SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, req.user.userId]
      );

      if (rows.length === 0) {
        res.status(403).json({ error: 'Not a member of this workspace' });
        return;
      }

      const result = await pool.query(
        `SELECT * FROM tasks WHERE workspace_id = $1 ORDER BY created_at DESC`,
        [workspaceId]
      );

      res.json(result.rows);
      return;
    }

    const tasks = await TaskModel.findByUserId(req.user.userId, {
      priority: priority as string,
      status: status as string
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET TASK BY ID
export const getTaskById = async (req: RequestWithUser, res: Response): Promise<void> => {
  const task = await assertTaskAccess(req.params.id, req.user!.userId);

  if (task === null) return void res.status(404).json({ error: 'Not found' });
  if (task === false) return void res.status(403).json({ error: 'Forbidden' });

  res.json(task);
};

// UPDATE
export const updateTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  const task = await assertTaskAccess(req.params.id, req.user!.userId);

  if (task === null) return void res.status(404).json({ error: 'Not found' });
  if (task === false) return void res.status(403).json({ error: 'Forbidden' });

  const updated = await TaskModel.update(req.params.id, req.body);

  if (updated?.workspace_id) {
    logActivity(updated.workspace_id, req.user!.userId, 'updated_task', updated.id).catch(console.error);
  }

  res.json(updated);
};

// DELETE
export const deleteTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  const task = await assertTaskAccess(req.params.id, req.user!.userId);

  if (task === null) return void res.status(404).json({ error: 'Not found' });
  if (task === false) return void res.status(403).json({ error: 'Forbidden' });

  if (task.workspace_id) {
    logActivity(task.workspace_id, req.user!.userId, 'deleted_task', task.id).catch(console.error);
  }

  await TaskModel.delete(req.params.id);
  res.json({ message: 'Deleted' });
};

// TOGGLE
export const toggleTaskCompletion = async (req: RequestWithUser, res: Response): Promise<void> => {
  const task = await assertTaskAccess(req.params.id, req.user!.userId);

  if (task === null) return void res.status(404).json({ error: 'Not found' });
  if (task === false) return void res.status(403).json({ error: 'Forbidden' });

  const updated = await TaskModel.update(req.params.id, {
    status: task.status === 'Completed' ? 'Todo' : 'Completed',
    completed_at: task.status === 'Completed' ? null : new Date()
  });

  if (updated?.workspace_id) {
    logActivity(updated.workspace_id, req.user!.userId, 'status_changed', updated.id).catch(console.error);
  }

  res.json(updated);
};