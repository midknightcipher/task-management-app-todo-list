import express from 'express';
import {
  createWorkspace,
  listWorkspaces,
  inviteMember,
  listMembers,
  removeMember,
  getActivity,
  deleteWorkspace // ✅ Add this import
} from '../controllers/workspaceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.delete('/:id', deleteWorkspace); // ✅ Add this route
router.post('/:id/invite', inviteMember);

router.get('/:id/members', listMembers);
router.delete('/:id/members/:memberId', removeMember);
router.get('/:id/activity', getActivity); 

export default router;