import express from 'express';
import {
  createWorkspace,
  listWorkspaces,
  inviteMember,
} from '../controllers/workspaceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.post('/:id/invite', inviteMember);

export default router;