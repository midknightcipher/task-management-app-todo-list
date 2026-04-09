import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const createTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const task = await TaskModel.create(req.user.userId, req.body);
    if (!task) {
      res.status(500).json({ error: 'Failed to create task' });
      return;
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

    const { priority, status } = req.query;
    const tasks = await TaskModel.findByUserId(req.user.userId, {
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
    if (!task || task.user_id !== req.user.userId) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

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
    if (!task || task.user_id !== req.user.userId) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const updatedTask = await TaskModel.update(req.params.id, req.body);
    if (!updatedTask) {
      res.status(500).json({ error: 'Failed to update task' });
      return;
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
    if (!task || task.user_id !== req.user.userId) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

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
    if (!task || task.user_id !== req.user.userId) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isCompleted = task.status === 'Completed';

    const updatedTask = await TaskModel.update(req.params.id, {
      status: isCompleted ? 'Todo' : 'Completed',
      completed_at: isCompleted ? null : new Date(),   // ✅ FIXED
    });

    if (!updatedTask) {
      res.status(500).json({ error: 'Failed to update task' });
      return;
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};