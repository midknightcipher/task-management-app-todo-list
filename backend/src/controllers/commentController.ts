import { Request, Response } from 'express';
import { CommentModel } from '../models/Comment';
import { TaskModel } from '../models/Task';
import { WorkspaceModel } from '../models/Workspace';
import { ActivityLogModel } from '../models/ActivityLog';

interface RequestWithUser extends Request {
  user?: { userId: string; email: string };
}

export const createComment = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { task_id, content } = req.body;

    if (!task_id || !content?.trim()) {
      res.status(400).json({ error: 'task_id and content are required' });
      return;
    }

    const task = await TaskModel.findById(task_id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isMember = await WorkspaceModel.isMember(task.workspace_id!, req.user.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const comment = await CommentModel.create(task_id, req.user.userId, content);
    if (!comment) {
      res.status(500).json({ error: 'Failed to create comment' });
      return;
    }

    // Log activity
    await ActivityLogModel.log({
      workspace_id: task.workspace_id!,
      task_id,
      user_id: req.user.userId,
      action: 'comment_added',
      meta: { comment_id: comment.id },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getComments = async (
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

    const comments = await CommentModel.findByTask(taskId);
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const deleted = await CommentModel.delete(req.params.id, req.user.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Comment not found or not yours' });
      return;
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
