import express from 'express';
import {
  createWorkspace,
  getWorkspaces,
  inviteToWorkspace,
  getWorkspaceMembers,
} from '../controllers/workspaceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.post('/invite', inviteToWorkspace);
router.get('/:id/members', getWorkspaceMembers);

export default router;
