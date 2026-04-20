import { Request, Response } from 'express';
import { WorkspaceModel } from '../models/Workspace';
import { UserModel } from '../models/User';

interface RequestWithUser extends Request {
  user?: { userId: string; email: string };
}

export const createWorkspace = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Workspace name is required' });
      return;
    }

    const workspace = await WorkspaceModel.create(name.trim(), req.user.userId);
    if (!workspace) {
      res.status(500).json({ error: 'Failed to create workspace' });
      return;
    }

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWorkspaces = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const workspaces = await WorkspaceModel.findByUserId(req.user.userId);
    res.json(workspaces);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const inviteToWorkspace = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { workspace_id, email, role = 'member' } = req.body;

    if (!workspace_id || !email) {
      res.status(400).json({ error: 'workspace_id and email are required' });
      return;
    }

    // Only workspace members can invite
    const isMember = await WorkspaceModel.isMember(workspace_id, req.user.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Find user by email
    const targetUser = await UserModel.findByEmail(email);
    if (!targetUser) {
      res.status(404).json({ error: 'No user found with that email address' });
      return;
    }

    if (targetUser.id === req.user.userId) {
      res.status(400).json({ error: 'You are already a member of this workspace' });
      return;
    }

    const validRoles = ['admin', 'member'];
    const memberRole = validRoles.includes(role) ? role : 'member';

    const member = await WorkspaceModel.addMember(workspace_id, targetUser.id, memberRole);
    if (!member) {
      res.status(500).json({ error: 'Failed to add member' });
      return;
    }

    res.status(201).json({ ...member, email: targetUser.email });
  } catch (error) {
    console.error('Invite to workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWorkspaceMembers = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: workspaceId } = req.params;

    const isMember = await WorkspaceModel.isMember(workspaceId, req.user.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const members = await WorkspaceModel.getMembers(workspaceId);
    res.json(members);
  } catch (error) {
    console.error('Get workspace members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
