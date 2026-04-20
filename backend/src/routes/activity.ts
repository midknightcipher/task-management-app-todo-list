import express from 'express';
import { getWorkspaceActivity, getTaskActivity } from '../controllers/activityController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// GET /api/activity?workspaceId=xxx
router.get('/', getWorkspaceActivity);

// GET /api/activity/task?taskId=xxx
router.get('/task', getTaskActivity);

export default router;
